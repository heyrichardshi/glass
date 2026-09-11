import { Container, StatusCodes } from "@azure/cosmos";
import { DatabaseProvider } from "./database";
import { PlaidItem } from "../models";
import { DatabaseError } from "../common/errors";
import { childLogger } from "../common/logger";

const log = childLogger("plaidItem.repo");

const PLAID_ITEM_CONTAINER_ID = "plaid_items";

/** A stored Item plus the Cosmos ETag used to compare-and-set the sync lease. */
export type LeasedPlaidItem = PlaidItem & { _etag: string };

export class PlaidItemRepository {
  private static instance: PlaidItemRepository;
  private promisedContainer: Promise<Container>;

  constructor() {
    this.promisedContainer = DatabaseProvider.getContainer({
      id: PLAID_ITEM_CONTAINER_ID,
      // Keyed on the Plaid item_id. The webhook receiver is handed nothing but that ID and has no
      // user context, so this lookup has to be a point read inside its ten-second budget.
      partitionKey: {
        paths: ["/id"],
      },
      indexingPolicy: {
        indexingMode: "consistent",
        automatic: true,
        includedPaths: [{ path: "/userId/?" }],
        excludedPaths: [
          { path: "/*" }, // Exclude everything by default to only index explicitly included properties
        ],
        compositeIndexes: [],
      },
    });
  }

  public static async getInstance(): Promise<PlaidItemRepository> {
    if (!PlaidItemRepository.instance) {
      PlaidItemRepository.instance = new PlaidItemRepository();
    }
    return PlaidItemRepository.instance;
  }

  /**
   * Creates the Plaid item if it doesn't exist, or updates it if it does (e.g. to persist a new
   * sync cursor or error code).
   */
  async upsert(item: PlaidItem): Promise<PlaidItem> {
    const container = await this.promisedContainer;

    const response = await container.items.upsert(item);

    if (
      response.statusCode !== StatusCodes.Ok &&
      response.statusCode !== StatusCodes.Created
    ) {
      throw new DatabaseError(
        `Failed to upsert Plaid item ${response.statusCode}: ${response}`,
      );
    }

    return response.resource as unknown as PlaidItem;
  }

  async findById(itemId: string): Promise<PlaidItem | undefined> {
    const container = await this.promisedContainer;

    try {
      const { resource } = await container
        .item(itemId, itemId)
        .read<PlaidItem>();
      return resource;
    } catch (err) {
      if (cosmosCode(err) === StatusCodes.NotFound) {
        return undefined;
      }
      throw err;
    }
  }

  /**
   * Takes the sync lease if it is free or expired. Returns the Item on success, or `undefined`
   * if the Item does not exist or another writer holds the lease.
   */
  async tryAcquireSyncLease(
    itemId: string,
    ttlMs: number,
  ): Promise<LeasedPlaidItem | undefined> {
    const container = await this.promisedContainer;
    const item = container.item(itemId, itemId);

    let existing: (PlaidItem & { _etag?: string }) | undefined;
    try {
      existing = (await item.read<PlaidItem>()).resource ?? undefined;
    } catch (err) {
      if (cosmosCode(err) === StatusCodes.NotFound) {
        return undefined;
      }
      throw err;
    }

    if (!existing) {
      return undefined;
    }

    if (!existing._etag) {
      throw new DatabaseError(
        `Plaid Item ${itemId} is missing an ETag; cannot acquire a sync lease.`,
      );
    }

    if (leaseIsHeld(existing.leaseExpiresAt)) {
      log.info({ itemId }, "sync lease held; skipping");
      return undefined;
    }

    const updated: PlaidItem = {
      ...withoutEtag(existing),
      leaseExpiresAt: new Date(Date.now() + ttlMs).toISOString(),
    };

    try {
      const response = await item.replace(updated, {
        accessCondition: { type: "IfMatch", condition: existing._etag },
      });
      return asLeased(response.resource as PlaidItem & { _etag?: string });
    } catch (err) {
      if (cosmosCode(err) === StatusCodes.PreconditionFailed) {
        log.info(
          { itemId },
          "sync lease lost to a concurrent writer; skipping",
        );
        return undefined;
      }
      throw err;
    }
  }

  /**
   * Persists `cursor`, clears `errorCode`, and drops the lease in one write.
   * A 412 means the document changed since we acquired the lease.
   * We must not clobber a newer cursor, so this throws rather than retrying.
   */
  async completeSync(leased: LeasedPlaidItem, cursor: string): Promise<void> {
    const container = await this.promisedContainer;
    const updated: PlaidItem = {
      ...withoutEtag(leased),
      cursor,
    };
    delete updated.leaseExpiresAt;
    delete updated.errorCode;

    try {
      await container.item(leased.id, leased.id).replace(updated, {
        accessCondition: { type: "IfMatch", condition: leased._etag },
      });
    } catch (err) {
      if (cosmosCode(err) === StatusCodes.PreconditionFailed) {
        throw new DatabaseError(
          `Failed to persist sync cursor for Plaid Item ${leased.id}: document changed since the lease was acquired.`,
        );
      }
      throw err;
    }
  }

  /**
   * Drops the lease without moving the cursor.
   * Used when apply fails or Plaid is not ready, so a retry can start immediately
   * rather than waiting for the lease to expire.
   * Pass `errorCode` to persist a connection error, or `null` to clear one.
   */
  async releaseSyncLease(
    leased: LeasedPlaidItem,
    patch?: { errorCode?: string | null },
  ): Promise<void> {
    const container = await this.promisedContainer;
    const updated: PlaidItem = withoutEtag(leased);
    delete updated.leaseExpiresAt;
    if (patch && "errorCode" in patch) {
      if (patch.errorCode == null) {
        delete updated.errorCode;
      } else {
        updated.errorCode = patch.errorCode;
      }
    }

    try {
      await container.item(leased.id, leased.id).replace(updated, {
        accessCondition: { type: "IfMatch", condition: leased._etag },
      });
    } catch (err) {
      if (cosmosCode(err) === StatusCodes.PreconditionFailed) {
        log.warn(
          { itemId: leased.id },
          "sync lease release lost to a concurrent write; leaving in place",
        );
        return;
      }
      throw err;
    }
  }

  /** Cross-partition by construction, since each Item is its own partition. */
  async listByUser(userId: string): Promise<PlaidItem[]> {
    const container = await this.promisedContainer;

    const response = await container.items
      .query<PlaidItem>({
        query: "SELECT * FROM c WHERE c.userId = @userId",
        parameters: [{ name: "@userId", value: userId }],
      })
      .fetchAll();

    return response.resources;
  }
}

function leaseIsHeld(leaseExpiresAt: string | undefined): boolean {
  if (!leaseExpiresAt) {
    return false;
  }
  const expiresAt = Date.parse(leaseExpiresAt);
  return !Number.isNaN(expiresAt) && expiresAt > Date.now();
}

function withoutEtag(item: PlaidItem & { _etag?: string }): PlaidItem {
  const rest = { ...item };
  delete rest._etag;
  return rest;
}

function cosmosCode(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return undefined;
  }
  const { code } = error as { code: unknown };
  if (typeof code === "number") {
    return code;
  }
  if (typeof code === "string") {
    const parsed = Number(code);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
}

function asLeased(item: PlaidItem & { _etag?: string }): LeasedPlaidItem {
  if (!item._etag) {
    throw new DatabaseError(
      `Plaid Item ${item.id} is missing an ETag after write.`,
    );
  }
  return item as LeasedPlaidItem;
}
