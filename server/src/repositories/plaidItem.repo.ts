import { Container, StatusCodes } from "@azure/cosmos";
import { DatabaseProvider } from "./database";
import { PlaidItem } from "../models";
import { DatabaseError } from "../common/errors";

const PLAID_ITEM_CONTAINER_ID = "plaid_items";

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
    } catch (err: any) {
      if (err.code === StatusCodes.NotFound) {
        return undefined;
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
