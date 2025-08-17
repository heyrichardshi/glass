import {
  BulkOperationResponse,
  Container,
  ReadOperationInput,
  StatusCodes,
  SqlParameter,
  SqlQuerySpec,
} from "@azure/cosmos";
import { Transaction, TransactionsList } from "../models";
import { DatabaseProvider } from "./database";
import { DatabaseError } from "../common/errors";
import { formatDate } from "../common/utils";

const TRANSACTION_CONTAINER_ID = "transactions";

export class TransactionRepository {
  private static instance: TransactionRepository;
  private promisedContainer: Promise<Container>;

  constructor() {
    this.promisedContainer = DatabaseProvider.getContainer({
      id: TRANSACTION_CONTAINER_ID,
      partitionKey: {
        paths: ["/householdId"],
      },
      indexingPolicy: {
        indexingMode: "consistent",
        automatic: true,
        includedPaths: [
          { path: "/date/?" },
          { path: "/tagIds/?" },
          { path: "/counterparty/id/?" },
          { path: "/categoryId/?" },
          { path: "/accountId/?" },
          { path: "/householdId/?" },
          { path: "/isDeleted/?" },
        ],
        excludedPaths: [
          { path: "/*" }, // Exclude everything by default to only index explicitly included properties
        ],
        // Don't need composite indexes for now, as we are always sorting by date alone, not multi-field sorting.
        compositeIndexes: [],
      },
    });
  }

  public static async getInstance(): Promise<TransactionRepository> {
    if (!TransactionRepository.instance) {
      TransactionRepository.instance = new TransactionRepository();
    }
    return TransactionRepository.instance;
  }

  /**
   * This method ensures that old records are compliant with the Transaction interface by adding new fields and
   * modifying updated fields, then writing the updated record to the database, if necessary.
   */
  async normalizeTransaction(raw: Partial<Transaction>): Promise<Transaction> {
    let changed = false;

    let transaction = { ...raw };

    // Changes on 2025 04 29:
    // - Type of `date` changed from `Date` to `string`
    // - Added `rawDate: string`

    // Transactions do not have a time of day associated with them, so it doesn't make sense to store the full ISO format.
    // We only want to store the year-month-day portion as a string.
    const shortDate = new Date(raw.date!!) // Safe assertion because `date` existed before this change.
      .toISOString()
      .substring(0, 10); // Takes the first 10 chars of the ISO string, i.e. "yyyy-MM-dd"
    if (raw.date != shortDate) {
      // The record being read has a full format date, so we want to commit this change
      changed = true;
      console.log(
        `Transaction ${transaction.id} does not have expected date string, expected '${shortDate}' but was '${raw.date}'.`,
      );
      transaction = { ...transaction, date: shortDate };
    }

    // We want to allow users to modify the date associated with a transaction, but want a reference to the date as it
    // appears on the bank statement, in case the user wants to revert their changes.
    if (!raw.rawDate) {
      changed = true;
      console.log(`Transaction ${transaction.id} does not have rawDate.`);

      // Take the existing date to be the raw date because at the time this field was introduced, there was no
      // capability for the user to modify the date.
      transaction = { ...transaction, rawDate: transaction.date!! };
    }

    // If we have made mutations to the transaction to normalize it, commit the result and return the record as it
    // exists in the table.
    if (changed) {
      console.log(
        `Transaction ${transaction.id} has been normalized, writing new object to database.`,
      );
      return this.upsert(transaction as Transaction);
    }

    return transaction as Transaction;
  }

  /**
   * Creates a new transaction if it doesn't exist, or updates it if it does.
   * @param transaction
   * @returns
   */
  async upsert(transaction: Transaction): Promise<Transaction> {
    const container = await this.promisedContainer;

    const response = await container.items.upsert(transaction);

    if (
      response.statusCode !== StatusCodes.Ok &&
      response.statusCode !== StatusCodes.Created
    ) {
      throw new DatabaseError(
        `Failed to upsert transaction ${response.statusCode}: ${response}`,
      );
    }

    return response.resource as unknown as Transaction;
  }

  async list(params: {
    userId: string;
    searchText?: string;
    accountIds?: string[];
    merchantIds?: string[];
    categoryIds?: string[];
    tagIds?: string[];
    startDate?: string;
    endDate?: string;
    paginationToken?: string;
  }): Promise<TransactionsList> {
    const container = await this.promisedContainer;

    let query = "SELECT * FROM c WHERE c.userId = @userId";
    const parameters: SqlParameter[] = [
      { name: "@userId", value: params.userId },
    ];

    if (params.searchText) {
      // Case-insensitive search for the search text in the description.
      // https://learn.microsoft.com/en-us/azure/cosmos-db/nosql/query/contains
      query += " AND CONTAINS(c.description, @searchText, true)";
      parameters.push({ name: "@searchText", value: params.searchText });
    }

    if (params.accountIds) {
      // https://learn.microsoft.com/en-us/azure/cosmos-db/nosql/query/array-contains
      query += " AND ARRAY_CONTAINS(@accountIds, c.accountId)";
      parameters.push({ name: "@accountIds", value: params.accountIds });
    }

    if (params.merchantIds) {
      query += " AND ARRAY_CONTAINS(@merchantIds, c.merchantId)";
      parameters.push({ name: "@merchantIds", value: params.merchantIds });
    }

    if (params.categoryIds) {
      query += " AND ARRAY_CONTAINS(@categoryIds, c.categoryId)";
      parameters.push({ name: "@categoryIds", value: params.categoryIds });
    }

    if (params.tagIds) {
      query += " AND ARRAY_CONTAINS(@tagIds, c.tagId)";
      parameters.push({ name: "@tagIds", value: params.tagIds });
    }

    if (params.startDate) {
      query += " AND c.date >= @startDate";
      parameters.push({ name: "@startDate", value: params.startDate });
    }

    if (params.endDate) {
      query += " AND c.date <= @endDate";
      parameters.push({ name: "@endDate", value: params.endDate });
    }

    query += " ORDER BY c.date DESC";

    const querySpec: SqlQuerySpec = { query, parameters };

    const response = await container.items
      .query<Transaction>(querySpec, {
        partitionKey: params.userId,
        maxItemCount: 50,
        continuationToken: params.paginationToken,
      })
      .fetchNext();

    const normalizedTransactions = await Promise.all(
      response.resources.map(
        async (transaction) => await this.normalizeTransaction(transaction),
      ),
    );

    return {
      transactions: normalizedTransactions,
      paginationToken: response.continuationToken,
    };
  }

  async listTransactionsByUser(
    userId: string,
    paginationToken?: string,
  ): Promise<TransactionsList> {
    const container = await this.promisedContainer;

    const response = await container.items
      .query<Transaction>(
        {
          query:
            "SELECT * FROM c WHERE c.userId = @userId ORDER BY c.date DESC",
          parameters: [{ name: "@userId", value: userId }],
        },
        {
          // TODO: need to update this to householdId once households are implemented; currently all hosueholds are = userId
          partitionKey: userId,
          maxItemCount: 50,
          continuationToken: paginationToken,
        },
      )
      .fetchNext();
    console.log(
      `Fetched ${response.resources.length} transactions for user ${userId} with pagination token ${paginationToken}, got next pagination token: ${response.continuationToken}`,
    );

    // Must normalize transactions to account for added/modified fields.
    const normalizedTransactions = await Promise.all(
      response.resources.map(
        async (transaction) => await this.normalizeTransaction(transaction),
      ),
    );

    return {
      transactions: normalizedTransactions,
      paginationToken: response.continuationToken,
    };
  }

  async listAllTransactionsForAccount(
    userId: string,
    accountId: string,
  ): Promise<TransactionsList> {
    const container = await this.promisedContainer;

    const response = await container.items
      .query<Transaction>(
        {
          query:
            "SELECT * FROM c WHERE c.userId = @userId AND c.accountId = @accountId ORDER BY c.date DESC",
          parameters: [
            { name: "@userId", value: userId },
            { name: "@accountId", value: accountId },
          ],
        },
        {
          // TODO: need to update this to householdId once households are implemented; currently all hosueholds are = userId
          partitionKey: userId,
        },
      )
      .fetchNext();
    console.log(
      `Fetched ${response.resources.length} transactions for user ${userId} and account ${accountId}`,
    );

    // Must normalize transactions to account for added/modified fields.
    const normalizedTransactions = await Promise.all(
      response.resources.map(
        async (transaction) => await this.normalizeTransaction(transaction),
      ),
    );

    return {
      transactions: normalizedTransactions,
    };
  }

  async get(
    transactionId: string,
    householdId: string,
  ): Promise<Transaction | undefined> {
    const container = await this.promisedContainer;

    try {
      const { resource } = await container
        .item(transactionId, householdId)
        .read<Transaction>();
      return resource;
    } catch (err: any) {
      if (err.code === 404) {
        return undefined;
      }
      throw err;
    }
  }

  async getBulk(
    transactionIds: string[],
    householdId: string,
  ): Promise<Record<string, Transaction | undefined>> {
    const container = await this.promisedContainer;

    const operations: ReadOperationInput[] = transactionIds.map(
      (transactionId) => {
        return {
          operationType: "Read",
          id: transactionId,
          partitionKey: householdId,
        };
      },
    );

    const response = await container.items.bulk(operations);
    if (response.length != transactionIds.length) {
      throw new DatabaseError(
        `Failed to read ${transactionIds.length} transactions, got ${response.length} responses`,
      );
    }

    return transactionIds.reduce(
      (acc, transactionId, index) => {
        const { statusCode, resourceBody } = response[index];
        if (statusCode === StatusCodes.Ok) {
          const transaction = resourceBody as unknown as Transaction;
          acc[transactionId] = transaction;
        } else if (statusCode === StatusCodes.NotFound) {
          acc[transactionId] = undefined;
        } else {
          throw new DatabaseError(
            `Failed to read transaction ${transactionId}: ${statusCode}: ${resourceBody}`,
          );
        }
        return acc;
      },
      {} as Record<string, Transaction | undefined>,
    );
  }

  async listByDateRange(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Transaction[]> {
    const container = await this.promisedContainer;

    const startDateString = formatDate(startDate);
    const endDateString = formatDate(endDate);

    const response = await container.items
      .query<Transaction>(
        {
          query:
            "SELECT * FROM c WHERE c.userId = @userId AND c.date >= @startDate AND c.date <= @endDate ORDER BY c.date DESC",
          parameters: [
            { name: "@userId", value: userId },
            { name: "@startDate", value: startDateString },
            { name: "@endDate", value: endDateString },
          ],
        },
        {
          // TODO: need to update this to householdId once households are implemented; currently all hosueholds are = userId
          partitionKey: userId,
        },
      )
      .fetchAll();

    console.log(
      `Fetched ${response.resources.length} transactions for user ${userId} between ${startDateString} and ${endDateString}`,
    );

    return response.resources;
  }

  async delete(transactionId: string, householdId: string): Promise<void> {
    const container = await this.promisedContainer;
    await container.item(transactionId, householdId).delete();
  }
}
