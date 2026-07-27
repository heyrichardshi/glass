import { ListAccountsResponse } from "@saffron/types";
import { NotFoundError } from "../common/errors";
import { Account, AccountType, Transaction, Merchant } from "../models";
import { Transaction as TellerTransaction } from "../models/teller";
import {
  AccountRepository,
  TransactionRepository,
  MerchantRepository,
  PlaidItemRepository,
} from "../repositories";
import * as plaid from "./plaid.service";
import { UNCATEGORIZED_CATEGORY_ID } from "../models/category";
import { toApiAccount } from "../models/api";
import { findFirstMatchingMerchant } from "../common/merchant-utils";

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
  // since Plaid rejects a bare "0" (it is treated as a falsy/nil value).
  return plaid.createLinkToken(`saffron-user-${userId}`, accessToken);
}

/**
 * Maps Plaid's account type/subtype onto Saffron's normalized AccountType vocabulary.
 */
function toSaffronAccountType(
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
 * Saffron accounts for it. Transactions are synced separately.
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
    type: toSaffronAccountType(plaidAccount.type, plaidAccount.subtype),
    status: "open",
    provider: "plaid",
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
 * Retrieves latest balance and transaction data for the given account from Teller, and updates the database.
 */
export async function refresh(accountId: string) {
  const accountRepo = await AccountRepository.getInstance();
  const transactionRepo = await TransactionRepository.getInstance();
  const merchantRepo = await MerchantRepository.getInstance();

  const account = await accountRepo.findById(accountId);
  if (!account) {
    throw new NotFoundError(`Account with ID '${accountId}' not found`);
  }

  if (account.status === "closed") {
    console.log(
      `Account ${accountId} is marked closed; skipping refresh.`,
    );
    return;
  }

  if (account.provider !== "plaid" || !account.tellerAccessToken) {
    console.log(
      `Skipping refresh for account ${accountId} (provider=${account.provider ?? "unknown"}); Teller is wound down.`,
    );
    return;
  }

  // TODO: Plaid transaction sync
}

export async function listForUser(
  userId: string,
): Promise<ListAccountsResponse> {
  const accountRepo = await AccountRepository.getInstance();
  const accounts = await accountRepo.listByUser(userId);

  // Connection health checks are provider-specific. The only previous check called Teller, which is
  // wound down, so we make no live provider calls here. Plaid connection health will be derived
  // during sync (next step) and mapped onto Account.status.
  return {
    accounts,
  };
}
