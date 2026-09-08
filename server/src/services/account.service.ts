import { ListAccountsResponse } from "@glass/types";
import { NotFoundError } from "../common/errors";
import { childLogger } from "../common/logger";
import { Account, AccountType } from "../models";
import { AccountRepository, PlaidItemRepository } from "../repositories";
import * as plaid from "./plaid.service";

const log = childLogger("account.service");

/**
 * Creates a Plaid Link token for the client to open Plaid Link. Pass an access token to launch
 * update mode against an existing Item.
 */
export async function createPlaidLinkToken(
  userId: string,
  accessToken?: string,
): Promise<string> {
  // Plaid's client_user_id must be a stable, non-empty identifier. Namespace the internal userId,
  // since Plaid rejects a bare "0" (it is treated as a falsy/nil value).
  return plaid.createLinkToken(`glass-user-${userId}`, accessToken);
}

/**
 * Maps Plaid's account type/subtype onto Glass's normalized AccountType vocabulary.
 */
function toGlassAccountType(
  plaidType: string,
  plaidSubtype?: string | null,
): AccountType {
  switch (plaidType) {
    case "credit":
      return "credit";
    case "loan":
      return "loan";
    case "investment":
    case "brokerage":
      return "investment";
    case "depository": {
      const savingsSubtypes = ["savings", "money market", "cd", "hsa"];
      return plaidSubtype && savingsSubtypes.includes(plaidSubtype)
        ? "savings"
        : "checking";
    }
    default:
      return "other";
  }
}

/**
 * Exchanges a Plaid Link public token for an access token, persists the Item, and creates the
 * Glass accounts for it. Transactions are synced separately.
 */
export async function exchangePlaidPublicToken(
  userId: string,
  publicToken: string,
): Promise<{ accountsRegisteredCount: number }> {
  const { accessToken, itemId } = await plaid.exchangePublicToken(publicToken);

  const { accounts: plaidAccounts, institutionId } =
    await plaid.getAccounts(accessToken);

  let institutionName: string | undefined;
  if (institutionId) {
    try {
      institutionName = await plaid.getInstitutionName(institutionId);
    } catch (error) {
      log.error(
        { err: error, institutionId },
        "failed to fetch institution name",
      );
    }
  }

  const plaidItemRepo = await PlaidItemRepository.getInstance();
  await plaidItemRepo.upsert({
    id: itemId,
    userId,
    accessToken,
    institutionId: institutionId ?? undefined,
    institutionName,
  });

  const accountRepo = await AccountRepository.getInstance();
  const accounts: Account[] = plaidAccounts.map((plaidAccount) => ({
    id: plaidAccount.account_id,
    userId,
    name: plaidAccount.name,
    institution: institutionName ?? "",
    balance: String(plaidAccount.balances.current ?? 0),
    mask: plaidAccount.mask ?? "",
    officialName: plaidAccount.official_name ?? plaidAccount.name,
    transactionsLastRefreshedAt: new Date(0).toISOString(),
    lastPostedTransactionId: "",
    type: toGlassAccountType(plaidAccount.type, plaidAccount.subtype),
    status: "open",
    plaidItemId: itemId,
    plaidAccountId: plaidAccount.account_id,
    plaidMetadata: {
      subtype: plaidAccount.subtype ?? undefined,
      institutionId: institutionId ?? undefined,
    },
  }));

  await Promise.all(accounts.map((account) => accountRepo.create(account)));

  log.info({ itemId, count: accounts.length }, "registered Plaid accounts");

  return { accountsRegisteredCount: accounts.length };
}

/**
 * Retrieves latest balance and transaction data for the given account, and updates the database.
 */
export async function refresh(accountId: string, userId: string) {
  const accountRepo = await AccountRepository.getInstance();

  const account = await accountRepo.findById(accountId, userId);
  if (!account) {
    throw new NotFoundError(`Account with ID '${accountId}' not found`);
  }

  if (account.status === "closed") {
    log.info({ accountId }, "account is closed; skipping refresh");
    return;
  }

  // TODO: Plaid transaction sync
}

export async function listForUser(
  userId: string,
): Promise<ListAccountsResponse> {
  const accountRepo = await AccountRepository.getInstance();
  const accounts = await accountRepo.listByUser(userId);

  // No live provider calls here. Plaid connection health is derived during sync and mapped onto
  // Account.status.
  return {
    accounts,
  };
}
