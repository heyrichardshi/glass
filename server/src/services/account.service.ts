import { ListAccountsResponse } from "@glass/types";
import { NotFoundError } from "../common/errors";
import { Account, AccountType } from "../models";
import { AccountRepository, PlaidItemRepository } from "../repositories";
import * as plaid from "./plaid.service";

// TODO: multitenancy. A single user/household backs the app for now.
const DEFAULT_USER_ID = "0";
const DEFAULT_HOUSEHOLD_ID = "0";

/**
 * Creates a Plaid Link token for the client to open Plaid Link. Pass an access token to launch
 * update mode against an existing Item.
 */
export async function createPlaidLinkToken(
  userId: string = DEFAULT_USER_ID,
  accessToken?: string,
): Promise<string> {
  // Plaid's client_user_id must be a stable, non-empty identifier. Namespace the internal userId,
  // since Plaid rejects a bare "0" (it is treated as a falsy/nil value). The prefix predates the
  // rename to Glass and is deliberately left alone: changing it makes Plaid treat future link
  // tokens as belonging to a different user.
  return plaid.createLinkToken(`saffron-user-${userId}`, accessToken);
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
      console.error(
        `Failed to fetch institution name for ${institutionId}:`,
        error,
      );
    }
  }

  const plaidItemRepo = await PlaidItemRepository.getInstance();
  await plaidItemRepo.upsert({
    id: itemId,
    userId: DEFAULT_USER_ID,
    householdId: DEFAULT_HOUSEHOLD_ID,
    accessToken,
    institutionId: institutionId ?? undefined,
    institutionName,
  });

  const accountRepo = await AccountRepository.getInstance();
  const accounts: Account[] = plaidAccounts.map((plaidAccount) => ({
    id: plaidAccount.account_id,
    userId: DEFAULT_USER_ID,
    householdId: DEFAULT_HOUSEHOLD_ID,
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

  console.log(
    `Registered ${accounts.length} Plaid account(s) for item ${itemId}.`,
  );

  return { accountsRegisteredCount: accounts.length };
}

/**
 * Retrieves latest balance and transaction data for the given account, and updates the database.
 */
export async function refresh(accountId: string) {
  const accountRepo = await AccountRepository.getInstance();

  const account = await accountRepo.findById(accountId);
  if (!account) {
    throw new NotFoundError(`Account with ID '${accountId}' not found`);
  }

  if (account.status === "closed") {
    console.log(`Account ${accountId} is marked closed; skipping refresh.`);
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
