import { NotFoundError } from "../common/errors";
import { childLogger } from "../common/logger";
import { findFirstMatchingMerchantFromTexts } from "../common/merchant-utils";
import { UNCATEGORIZED_CATEGORY_ID } from "../models/category";
import { Account, Merchant, PlaidItem, Transaction } from "../models";
import {
  AccountRepository,
  MerchantRepository,
  PlaidItemRepository,
  TransactionRepository,
} from "../repositories";
import type { LeasedPlaidItem } from "../repositories/plaidItem.repo";
import {
  getAccounts,
  getPlaidErrorCode,
  isItemConnectionError,
  syncTransactions,
  type TransactionSyncUpdate,
} from "./plaid.service";

const log = childLogger("sync.service");

/** Long enough for a full historical pull; short enough that a crashed holder is retried soon. */
const SYNC_LEASE_TTL_MS = 5 * 60 * 1000;

const PLACEHOLDER_COUNTERPARTY = { id: "0", type: "merchant" as const };

/** How many added/modified/removed rows to include in the inspect log. */
const SYNC_LOG_SAMPLE = 8;

type PlaidSyncTransaction = TransactionSyncUpdate["added"][number];

export type SyncItemResult =
  | { status: "synced"; added: number; modified: number; removed: number }
  | { status: "skipped" }
  | { status: "not_ready" }
  | { status: "item_error"; errorCode: string };

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

    await applySyncUpdate(leased.userId, leased.id, update);

    try {
      await refreshItemAccounts(leased);
    } catch (balanceError) {
      const balanceErrorCode = getPlaidErrorCode(balanceError);
      if (balanceErrorCode && isItemConnectionError(balanceErrorCode)) {
        return await persistItemConnectionError(
          itemRepo,
          leased,
          balanceErrorCode,
        );
      }
      log.error(
        { err: balanceError, itemId },
        "failed to refresh account balances",
      );
    }

    // TODO: persist nextCursor via completeSync once apply is verified against live
    // data. Until then, drop the lease without moving the cursor so a later refresh
    // re-fetches this batch from Plaid instead of skipping it.
    // await itemRepo.completeSync(leased, update.nextCursor);
    await itemRepo.releaseSyncLease(leased, { errorCode: null });

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
    const errorCode = getPlaidErrorCode(error);
    if (errorCode === "PRODUCT_NOT_READY") {
      log.info({ itemId }, "transactions not ready; cursor not advanced");
      await itemRepo.releaseSyncLease(leased);
      return { status: "not_ready" };
    }

    if (errorCode && isItemConnectionError(errorCode)) {
      return await persistItemConnectionError(itemRepo, leased, errorCode);
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

async function persistItemConnectionError(
  itemRepo: PlaidItemRepository,
  leased: LeasedPlaidItem,
  errorCode: string,
): Promise<Extract<SyncItemResult, { status: "item_error" }>> {
  log.info(
    { itemId: leased.id, errorCode },
    "item error; marking accounts disconnected",
  );
  await markAccountsDisconnected(leased.userId, leased.id);
  await itemRepo.releaseSyncLease(leased, { errorCode });
  return { status: "item_error", errorCode };
}

/**
 * Sets every non-closed account on the Item to disconnected.
 * Closed accounts stay closed.
 */
async function markAccountsDisconnected(
  userId: string,
  itemId: string,
): Promise<void> {
  const accountRepo = await AccountRepository.getInstance();
  const accounts = await accountRepo.listByPlaidItemId(userId, itemId);
  let marked = 0;
  for (const account of accounts) {
    if (account.status === "closed" || account.status === "disconnected") {
      continue;
    }
    await accountRepo.update({ ...account, status: "disconnected" });
    marked += 1;
  }
  log.info(
    { itemId, marked, total: accounts.length },
    "marked accounts disconnected",
  );
}

/**
 * Pulls `/accounts/get`, writes balances, sets `transactionsLastRefreshedAt`,
 * and reopens accounts that were disconnected.
 * Closed accounts are left alone.
 */
async function refreshItemAccounts(item: PlaidItem): Promise<void> {
  const { accounts: plaidAccounts } = await getAccounts(item.accessToken);
  const byPlaidId = new Map(
    plaidAccounts.map((plaidAccount) => [plaidAccount.account_id, plaidAccount]),
  );

  const accountRepo = await AccountRepository.getInstance();
  const accounts = await accountRepo.listByPlaidItemId(item.userId, item.id);
  const now = new Date().toISOString();

  for (const account of accounts) {
    if (account.status === "closed") {
      continue;
    }
    const plaidAccount = byPlaidId.get(account.plaidAccountId ?? account.id);
    const updated: Account = {
      ...account,
      status: "open",
      transactionsLastRefreshedAt: now,
      ...(plaidAccount
        ? { balance: String(plaidAccount.balances.current ?? 0) }
        : {}),
    };
    await accountRepo.update(updated);
  }
}

/**
 * Writes the accumulated added, modified and removed updates.
 */
async function applySyncUpdate(
  userId: string,
  itemId: string,
  update: TransactionSyncUpdate,
): Promise<void> {
  const transactionRepo = await TransactionRepository.getInstance();
  const merchantRepo = await MerchantRepository.getInstance();
  const merchants = await merchantRepo.listAll();

  const unmatched: PlaidSyncTransaction[] = [];

  const fresh = update.added.filter((tx) => !tx.pending_transaction_id);
  const replacements = update.added.filter((tx) => tx.pending_transaction_id);

  for (const plaidTx of fresh) {
    const matched = await applyAdded(
      transactionRepo,
      userId,
      plaidTx,
      merchants,
    );
    if (!matched) {
      unmatched.push(plaidTx);
    }
  }
  for (const plaidTx of replacements) {
    const matched = await applyAdded(
      transactionRepo,
      userId,
      plaidTx,
      merchants,
    );
    if (!matched) {
      unmatched.push(plaidTx);
    }
  }

  for (const plaidTx of update.modified) {
    await applyModified(transactionRepo, userId, plaidTx, merchants);
  }

  for (const removed of update.removed) {
    await applyRemoved(transactionRepo, userId, removed.transaction_id);
  }

  log.info(
    {
      itemId,
      added: update.added.length,
      modified: update.modified.length,
      removed: update.removed.length,
      unmatched: unmatched.length,
      unmatchedSample: unmatched.slice(0, SYNC_LOG_SAMPLE).map(sampleAdded),
    },
    "applied sync update",
  );
}

async function applyAdded(
  repo: TransactionRepository,
  userId: string,
  plaidTx: PlaidSyncTransaction,
  merchants: Merchant[],
): Promise<boolean> {
  const pendingId = plaidTx.pending_transaction_id;
  if (pendingId) {
    const pending = await repo.get(pendingId, userId);
    if (pending && !pending.plaidIsDeleted) {
      const posted = assignMerchantIfUnset(
        overlayProvider(pending, plaidTx),
        plaidTx,
        merchants,
      );
      delete posted.plaidIsDeleted;
      await repo.replacePendingWithPosted(posted, pendingId);
      return posted.counterparty.id !== PLACEHOLDER_COUNTERPARTY.id;
    }
  }

  const existing = await repo.get(plaidTx.transaction_id, userId);
  if (existing && !existing.plaidIsDeleted) {
    const updated = overlayProvider(existing, plaidTx);
    const withMerchant = assignMerchantIfUnset(updated, plaidTx, merchants);
    delete withMerchant.plaidIsDeleted;
    await repo.upsert(withMerchant);
    return withMerchant.counterparty.id !== PLACEHOLDER_COUNTERPARTY.id;
  }

  const created = createFromPlaid(userId, plaidTx, merchants);
  await repo.upsert(created);
  return created.counterparty.id !== PLACEHOLDER_COUNTERPARTY.id;
}

async function applyModified(
  repo: TransactionRepository,
  userId: string,
  plaidTx: PlaidSyncTransaction,
  merchants: Merchant[],
): Promise<void> {
  const existing = await repo.get(plaidTx.transaction_id, userId);
  if (!existing || existing.plaidIsDeleted) {
    await repo.upsert(createFromPlaid(userId, plaidTx, merchants));
    return;
  }
  const updated = assignMerchantIfUnset(
    overlayProvider(existing, plaidTx),
    plaidTx,
    merchants,
  );
  delete updated.plaidIsDeleted;
  await repo.upsert(updated);
}

async function applyRemoved(
  repo: TransactionRepository,
  userId: string,
  transactionId: string,
): Promise<void> {
  const existing = await repo.get(transactionId, userId);
  if (!existing || existing.plaidIsDeleted) {
    return;
  }
  await repo.markPlaidDeleted(existing);
}

function createFromPlaid(
  userId: string,
  plaidTx: PlaidSyncTransaction,
  merchants: Merchant[],
): Transaction {
  const provider = providerFields(userId, plaidTx);
  const merchant = matchMerchant(plaidTx, merchants);
  return {
    ...provider,
    description: provider.rawDescription,
    notes: "",
    counterparty: merchant
      ? { id: merchant.id, type: "merchant" }
      : PLACEHOLDER_COUNTERPARTY,
    categoryId: merchant?.defaultCategoryId ?? UNCATEGORIZED_CATEGORY_ID,
    tagIds: [],
    linkedTransactionIds: [],
    history: [],
  };
}

/**
 * Clone the existing document and overwrite only provider-owned fields.
 */
function overlayProvider(
  existing: Transaction,
  plaidTx: PlaidSyncTransaction,
): Transaction {
  const provider = providerFields(existing.userId, plaidTx);
  return {
    ...existing,
    ...provider,
    description:
      existing.description === existing.rawDescription
        ? provider.rawDescription
        : existing.description,
    date: existing.date === existing.rawDate ? provider.date : existing.date,
  };
}

function assignMerchantIfUnset(
  transaction: Transaction,
  plaidTx: PlaidSyncTransaction,
  merchants: Merchant[],
): Transaction {
  if (transaction.counterparty.id !== PLACEHOLDER_COUNTERPARTY.id) {
    return transaction;
  }
  const merchant = matchMerchant(plaidTx, merchants);
  if (!merchant) {
    return transaction;
  }
  return {
    ...transaction,
    counterparty: { id: merchant.id, type: "merchant" },
    categoryId:
      transaction.categoryId === UNCATEGORIZED_CATEGORY_ID
        ? merchant.defaultCategoryId
        : transaction.categoryId,
  };
}

function providerFields(
  userId: string,
  plaidTx: PlaidSyncTransaction,
): Pick<
  Transaction,
  | "id"
  | "userId"
  | "accountId"
  | "amount"
  | "currency"
  | "rawDate"
  | "date"
  | "rawDescription"
  | "status"
  | "plaidTransactionId"
  | "plaidPendingTransactionId"
  | "plaidMetadata"
> {
  const pfc = plaidTx.personal_finance_category;
  return {
    id: plaidTx.transaction_id,
    userId,
    accountId: plaidTx.account_id,
    amount: String(plaidTx.amount),
    currency:
      plaidTx.iso_currency_code ?? plaidTx.unofficial_currency_code ?? "USD",
    rawDate: plaidTx.date,
    date: plaidTx.date,
    rawDescription: plaidTx.original_description || plaidTx.name,
    status: plaidTx.pending ? "pending" : "posted",
    plaidTransactionId: plaidTx.transaction_id,
    plaidPendingTransactionId: plaidTx.pending_transaction_id ?? undefined,
    plaidMetadata: {
      personalFinanceCategory: pfc
        ? `${pfc.primary}/${pfc.detailed}`
        : undefined,
      merchantName: plaidTx.merchant_name ?? undefined,
      merchantEntityId: plaidTx.merchant_entity_id ?? undefined,
      merchantLogoUrl: plaidTx.logo_url ?? undefined,
      merchantWebsite: plaidTx.website ?? undefined,
      authorizedDate: plaidTx.authorized_date ?? undefined,
    },
  };
}

function matchMerchant(
  plaidTx: PlaidSyncTransaction,
  merchants: Merchant[],
): Merchant | undefined {
  return findFirstMatchingMerchantFromTexts(
    [plaidTx.original_description, plaidTx.name, plaidTx.merchant_name],
    merchants,
  );
}

function sampleAdded(tx: PlaidSyncTransaction) {
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
