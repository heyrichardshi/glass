import { ListAccountsResponse, RegisterAccountsResponse } from "@saffron/types";
import {
  NotFoundError,
  TellerAccountClosedError,
  TellerAccountDisconnectedError,
} from "../common/errors";
import { Account, Transaction, Merchant } from "../models";
import { Transaction as TellerTransaction } from "../models/teller";
import {
  AccountRepository,
  TransactionRepository,
  MerchantRepository,
} from "../repositories";
import * as teller from "./teller.service";
import { UNCATEGORIZED_CATEGORY_ID } from "../models/category";
import { toApiAccount } from "../models/api";
import { findFirstMatchingMerchant } from "../common/merchant-utils";

export async function registerAccountsFromToken(
  token: string,
): Promise<RegisterAccountsResponse> {
  // Retrieve accounts associated with this token from Teller
  console.log("Fetching accounts...");
  const tellerAccounts = await teller.listAccounts(token);
  console.log(`Fetched ${tellerAccounts.length} account(s)`);

  // Convert to own structure
  const accounts: Account[] = await Promise.all(
    tellerAccounts.map(async (account) => {
      let balance = "0";
      let status: Account["status"] =
        account.status === "open" ? "open" : "closed";

      if (status === "open") {
        try {
          console.log(`Retrieving balance for account ${account.name}...`);
          const balanceData = await teller.getAccountBalance(account.id, token);
          balance = balanceData.ledger ?? "0";
          console.log(
            `Retrieved balance for account ${account.name}: ${balanceData.available} / ${balanceData.ledger}`,
          );
        } catch (error) {
          if (error instanceof TellerAccountClosedError) {
            console.log(
              `Account ${account.name} is closed; skipping balance fetch.`,
            );
            status = "closed";
          } else {
            throw error;
          }
        }
      }

      return {
        id: account.id,
        userId: "0", // TODO: multitenancy
        householdId: "0", // TODO: multitenancy
        name: account.name,
        institution: account.institution.name,
        balance,
        mask: account.last_four,
        officialName: account.name,
        transactionsLastRefreshedAt: new Date(0).toISOString(),
        lastPostedTransactionId: "",
        // TODO: normalize Teller's raw type to Saffron's AccountType. Legacy Teller path; Teller is
        // wound down, so this is effectively dead code pending removal.
        type: account.type as Account["type"],
        status,
        tellerAccessToken: token,
        tellerEnrollmentId: account.enrollment_id,
      };
    }),
  );

  const accountRepo = await AccountRepository.getInstance();

  console.log("Upserting accounts into db...");
  await Promise.all(
    accounts.map(async (account) => {
      const existing = await accountRepo.findById(account.id);
      if (existing) {
        // Reconnect: refresh the token and status while preserving transaction history.
        console.log(`Updating existing account ${account.id} with new access token.`);
        await accountRepo.update({
          ...existing,
          tellerAccessToken: account.tellerAccessToken,
          tellerEnrollmentId: account.tellerEnrollmentId,
          status: account.status,
          balance: account.balance,
        });
      } else {
        console.log(`Creating new account ${account.id}.`);
        await accountRepo.create(account);
      }
    }),
  );

  return {
    accountsRegisteredCount: accounts.length,
  };
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
      `Account ${accountId} is marked closed; skipping Teller refresh.`,
    );
    return;
  }

  const tellerAccessToken = account.tellerAccessToken;
  if (!tellerAccessToken) {
    console.log(
      `Account ${accountId} has no Teller access token; skipping Teller refresh.`,
    );
    return;
  }

  console.log("Fetching transactions...");
  let tellerTransactions: TellerTransaction[];
  try {
    tellerTransactions = await teller.listAccountTransactions(
      accountId,
      tellerAccessToken,
    );
  } catch (error: unknown) {
    if (error instanceof TellerAccountClosedError) {
      console.log(
        `Teller reports account ${accountId} is closed; marking account and skipping further refresh attempts.`,
      );
      account.status = "closed";
      await accountRepo.update(account);
      return;
    }
    if (error instanceof TellerAccountDisconnectedError) {
      console.log(
        `Teller reports account ${accountId} enrollment is disconnected; marking account disconnected.`,
      );
      account.status = "disconnected";
      await accountRepo.update(account);
      return;
    }
    throw error;
  }
  console.log(`Fetched ${tellerTransactions.length} transaction(s)`);

  /**
   * TODO: Reduce the number of transactions we need to process by only processing transactions that are not already in the database or pending transactions in the database. Need to account for:
   * - long-standing pending transactions (i.e. pending transactions that have posted transactions after them)
   * - pending transactions that are removed (i.e. never posted)
   */

  // Get all known transactions for this account.
  const knownTransactions = await transactionRepo.listAllTransactionsForAccount(
    account.userId,
    accountId,
  );
  console.log(
    `Found ${knownTransactions.transactions.length} existing transactions for account ${accountId}.`,
  );

  // Create a map of known transaction ids to their index in the list for easy lookup.
  const knownTransactionIdToIndex = new Map<string, number>();
  for (let i = 0; i < knownTransactions.transactions.length; i++) {
    const transaction = knownTransactions.transactions[i];
    knownTransactionIdToIndex.set(transaction.id, i);
  }

  const transactionsToWrite: Transaction[] = [];

  // Fetch merchants to apply matchers to auto set merchant and category on new transactions
  const merchants: Merchant[] = await merchantRepo.listAll(account.householdId);

  for (const transaction of tellerTransactions) {
    const existingTransactionIndex = knownTransactionIdToIndex.get(
      transaction.id,
    );
    if (existingTransactionIndex !== undefined) {
      const existingTransaction =
        knownTransactions.transactions[existingTransactionIndex];

      const updatedTransaction = buildUpdatedTransaction(
        existingTransaction,
        transaction,
      );
      if (updatedTransaction) {
        transactionsToWrite.push(updatedTransaction);
      }

      knownTransactionIdToIndex.delete(transaction.id);
    } else {
      // This transaction does not exist in the database, so we need to create it.

      let categoryId = UNCATEGORIZED_CATEGORY_ID;
      let counterpartyId = "0";

      const matchedMerchant = findFirstMatchingMerchant(
        transaction.description,
        merchants,
      );
      if (matchedMerchant) {
        counterpartyId = matchedMerchant.id;
        categoryId = matchedMerchant.defaultCategoryId;
      }

      transactionsToWrite.push({
        id: transaction.id,
        userId: "0", // TODO: multitenancy
        householdId: "0", // TODO: multitenancy
        accountId: accountId,
        amount: transaction.amount,
        currency: "USD",
        rawDate: transaction.date,
        date: transaction.date,
        rawDescription: transaction.description,
        description: transaction.description,
        notes: "",
        status: transaction.status == "posted" ? "posted" : "pending",
        counterparty: {
          id: counterpartyId,
          type: "merchant",
        },
        categoryId: categoryId,
        tagIds: [],
        linkedTransactionIds: [],
        history: [],
        tellerMetadata: {
          type: transaction.type,
          category: transaction.details.category,
          counterparty: transaction.details.counterparty?.name,
        },
      });
    }
  }

  // Any remaining transactions in the map are pending transactions that have have been removed without posting, so should be deleted.
  const transactionIdsToDelete: string[] = Array.from(
    knownTransactionIdToIndex.keys(),
  );

  console.log(
    `Writing ${transactionsToWrite.length} new transactions and deleting ${transactionIdsToDelete.length} previously pending transactions.`,
  );

  transactionsToWrite.forEach((transaction) => {
    transactionRepo.upsert(transaction);
  });

  transactionIdsToDelete.forEach((transactionId) => {
    transactionRepo.delete(transactionId, account.householdId);
  });

  // Update refresh marker regardless of whether new transactions were found.
  account.transactionsLastRefreshedAt = new Date(Date.now()).toISOString();
  accountRepo.update(account);
}

// Helper function to build an updated transaction to write, if necessary.
function buildUpdatedTransaction(
  existingTransaction: Transaction,
  tellerTransaction: TellerTransaction,
): Transaction | undefined {
  // Only need to update if the raw date, description, or status has changed.
  if (
    existingTransaction.rawDate === tellerTransaction.date &&
    existingTransaction.rawDescription === tellerTransaction.description &&
    existingTransaction.status === tellerTransaction.status
  ) {
    return undefined;
  }

  // We want to keep user-defined values, so check if the raw values match.
  const isOriginalDate =
    existingTransaction.date === existingTransaction.rawDate;
  const isOriginalDescription =
    existingTransaction.description === existingTransaction.rawDescription;

  return {
    ...existingTransaction,
    rawDate: tellerTransaction.date,
    date: isOriginalDate ? tellerTransaction.date : existingTransaction.date,
    rawDescription: tellerTransaction.description,
    description: isOriginalDescription
      ? tellerTransaction.description
      : existingTransaction.description,
    status: tellerTransaction.status == "posted" ? "posted" : "pending",
  };
}

export async function listForUser(
  userId: string,
): Promise<ListAccountsResponse> {
  const accountRepo = await AccountRepository.getInstance();
  const accounts = await accountRepo.listByUser(userId);

  // Perform a health check on all accounts in series to avoid hammering Teller and hitting rate limits.
  const healthCheckedAccounts = [];
  for (const account of accounts) {
    const isHealthy = await isAccountHealthy(account);
    if (!isHealthy) {
      healthCheckedAccounts.push({
        ...account,
        status: "disconnected" as const, // Explicitly type the status to avoid type inference issues due to spread.
        tellerEnrollmentId: account.tellerEnrollmentId,
      });
    } else {
      healthCheckedAccounts.push(account);
    }
  }

  return {
    accounts: healthCheckedAccounts,
  };
}

async function isAccountHealthy(account: Account): Promise<boolean> {
  if (account.status === "closed") {
    return true;
  }

  const tellerAccessToken = account.tellerAccessToken;
  if (!tellerAccessToken) {
    // Non-Teller (or tokenless) accounts have no Teller health check.
    return true;
  }

  try {
    await teller.getAccount(account.id, tellerAccessToken);
  } catch (error: unknown) {
    if (error instanceof TellerAccountClosedError) {
      console.log(
        `Teller reports account ${account.id} is closed during health check; marking account closed and skipping future calls.`,
      );
      account.status = "closed";
      const accountRepo = await AccountRepository.getInstance();
      await accountRepo.update(account);
      return true;
    }

    if (error instanceof TellerAccountDisconnectedError) {
      return false;
    }

    // Log unknown error for triaging but consider it healthy for now.
    console.error(
      `Unknown error checking health of account ${account.id}: ${JSON.stringify(error)}`,
    );
  }
  return true;
}
