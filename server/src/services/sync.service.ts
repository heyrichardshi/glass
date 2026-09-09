import { NotFoundError } from "../common/errors";
import { childLogger } from "../common/logger";
import { PlaidItemRepository } from "../repositories";
import {
  getPlaidErrorCode,
  syncTransactions,
  type TransactionSyncUpdate,
} from "./plaid.service";

const log = childLogger("sync.service");

/** Long enough for a full historical pull; short enough that a crashed holder is retried soon. */
const SYNC_LEASE_TTL_MS = 5 * 60 * 1000;

export type SyncItemResult =
  | { status: "synced"; added: number; modified: number; removed: number }
  | { status: "skipped" }
  | { status: "not_ready" };

/** How many added/modified/removed rows to include in the inspect log. */
const SYNC_LOG_SAMPLE = 8;

/**
 * Applies one Plaid `/transactions/sync` to the Item:
 * load, lease, fetch every page, then apply the accumulated batch.
 */
export async function syncItem(itemId: string): Promise<SyncItemResult> {
  const itemRepo = await PlaidItemRepository.getInstance();
  const leased = await itemRepo.tryAcquireSyncLease(itemId, SYNC_LEASE_TTL_MS);

  if (!leased) {
    const existing = await itemRepo.findById(itemId);
    if (!existing) {
      throw new NotFoundError(`Plaid Item '${itemId}' not found`);
    }
    log.info({ itemId }, "sync skipped; lease held");
    return { status: "skipped" };
  }

  try {
    const update = await syncTransactions(leased.accessToken, leased.cursor);

    if (!update.nextCursor) {
      log.info({ itemId }, "transactions not ready; cursor not advanced");
      await itemRepo.releaseSyncLease(leased);
      return { status: "not_ready" };
    }

    await applySyncUpdate(leased.id, update);

    // TODO: persist nextCursor via completeSync once apply is verified against live
    // data. Until then, drop the lease without moving the cursor so a later refresh
    // re-fetches this batch from Plaid instead of skipping it.
    // await itemRepo.completeSync(leased, update.nextCursor);
    await itemRepo.releaseSyncLease(leased);

    log.info(
      {
        itemId,
        pages: update.pages,
        added: update.added.length,
        modified: update.modified.length,
        removed: update.removed.length,
        pendingAdded: update.added.filter((tx) => tx.pending).length,
        postedWithPendingId: update.added.filter(
          (tx) => tx.pending_transaction_id,
        ).length,
        addedSample: update.added.slice(0, SYNC_LOG_SAMPLE).map(sampleAdded),
        modifiedSample: update.modified
          .slice(0, SYNC_LOG_SAMPLE)
          .map(sampleAdded),
        removedSample: update.removed.slice(0, SYNC_LOG_SAMPLE).map((tx) => ({
          transaction_id: tx.transaction_id,
          account_id: tx.account_id,
        })),
      },
      "synced item; cursor not persisted",
    );

    return {
      status: "synced",
      added: update.added.length,
      modified: update.modified.length,
      removed: update.removed.length,
    };
  } catch (error) {
    if (getPlaidErrorCode(error) === "PRODUCT_NOT_READY") {
      log.info({ itemId }, "transactions not ready; cursor not advanced");
      await itemRepo.releaseSyncLease(leased);
      return { status: "not_ready" };
    }

    try {
      await itemRepo.releaseSyncLease(leased);
    } catch (releaseError) {
      log.error(
        { err: releaseError, itemId },
        "failed to release sync lease after error",
      );
    }
    throw error;
  }
}

/**
 * Writes the accumulated added, modified and removed updates.
 */
async function applySyncUpdate(
  itemId: string,
  update: TransactionSyncUpdate,
): Promise<void> {
  log.info(
    {
      itemId,
      added: update.added.length,
      modified: update.modified.length,
      removed: update.removed.length,
    },
    "accumulated sync update; apply is a later step",
  );
}

function sampleAdded(tx: TransactionSyncUpdate["added"][number]) {
  return {
    transaction_id: tx.transaction_id,
    account_id: tx.account_id,
    amount: tx.amount,
    date: tx.date,
    name: tx.name,
    merchant_name: tx.merchant_name,
    original_description: tx.original_description,
    pending: tx.pending,
    pending_transaction_id: tx.pending_transaction_id,
  };
}
