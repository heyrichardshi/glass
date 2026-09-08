import {
  Container,
  ReadOperationInput,
  StatusCodes,
  SqlParameter,
  SqlQuerySpec,
} from "@azure/cosmos";
import { Transaction, TransactionsList } from "../models";
import { DatabaseProvider } from "./database";
import { DatabaseError } from "../common/errors";
import { childLogger } from "../common/logger";
import { formatDate } from "../common/utils";

const log = childLogger("transaction.repo");

const TRANSACTION_CONTAINER_ID = "transactions";

export class TransactionRepository {
  private static instance: TransactionRepository;
  private promisedContainer: Promise<Container>;

  constructor() {
    this.promisedContainer = DatabaseProvider.getContainer({
      id: TRANSACTION_CONTAINER_ID,
      partitionKey: {
        paths: ["/userId"],
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
          { path: "/isDeleted/?" },
          // Both are needed by the Plaid sync path: a posted transaction is matched to the row it
          // replaces, and a removed transaction has to be found by whatever still references it.
          { path: "/plaidTransactionId/?" },
          { path: "/linkedTransactionIds/?" },
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

    const filters: string[] = [];
    const parameters: SqlParameter[] = [];

    if (params.searchText) {
      // Case-insensitive search for the search text in the description.
      // https://learn.microsoft.com/en-us/azure/cosmos-db/nosql/query/contains
      filters.push("CONTAINS(c.description, @searchText, true)");
      parameters.push({ name: "@searchText", value: params.searchText });
    }

    if (params.accountIds && params.accountIds.length > 0) {
      // https://learn.microsoft.com/en-us/azure/cosmos-db/nosql/query/array-contains
      filters.push("ARRAY_CONTAINS(@accountIds, c.accountId)");
      parameters.push({ name: "@accountIds", value: params.accountIds });
    }

    if (params.merchantIds && params.merchantIds.length > 0) {
      filters.push("ARRAY_CONTAINS(@merchantIds, c.counterparty.id)");
      parameters.push({ name: "@merchantIds", value: params.merchantIds });
    }

    if (params.categoryIds && params.categoryIds.length > 0) {
      filters.push("ARRAY_CONTAINS(@categoryIds, c.categoryId)");
      parameters.push({ name: "@categoryIds", value: params.categoryIds });
    }

    if (params.tagIds && params.tagIds.length > 0) {
      // ARRAY_CONTAINS_ANY is variadic, so the simpler approach than spreading the array is to loop through the tagIds
      // array in the record
      filters.push(
        "EXISTS(SELECT VALUE t FROM t IN c.tagIds WHERE ARRAY_CONTAINS(@tagIds, t))",
      );
      parameters.push({ name: "@tagIds", value: params.tagIds });
    }

    if (params.startDate) {
      filters.push("c.date >= @startDate");
      parameters.push({ name: "@startDate", value: params.startDate });
    }

    if (params.endDate) {
      filters.push("c.date <= @endDate");
      parameters.push({ name: "@endDate", value: params.endDate });
    }

    const where = filters.length > 0 ? ` WHERE ${filters.join(" AND ")}` : "";
    const querySpec: SqlQuerySpec = {
      query: `SELECT * FROM c${where} ORDER BY c.date DESC`,
      parameters,
    };

    const response = await container.items
      .query<Transaction>(querySpec, {
        partitionKey: params.userId,
        maxItemCount: 50,
        continuationToken: params.paginationToken,
      })
      .fetchNext();

    return {
      transactions: response.resources,
      paginationToken: response.continuationToken,
    };
  }

  async listTransactionsByUser(
    userId: string,
    paginationToken?: string,
  ): Promise<TransactionsList> {
    const container = await this.promisedContainer;

    const response = await container.items
      .query<Transaction>("SELECT * FROM c ORDER BY c.date DESC", {
        partitionKey: userId,
        maxItemCount: 50,
        continuationToken: paginationToken,
      })
      .fetchNext();
    log.debug(
      {
        userId,
        count: response.resources.length,
        paginationToken,
        nextPaginationToken: response.continuationToken,
      },
      "fetched transactions for user",
    );

    return {
      transactions: response.resources,
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
            "SELECT * FROM c WHERE c.accountId = @accountId ORDER BY c.date DESC",
          parameters: [{ name: "@accountId", value: accountId }],
        },
        {
          partitionKey: userId,
        },
      )
      .fetchNext();
    log.debug(
      { userId, accountId, count: response.resources.length },
      "fetched transactions for account",
    );

    return {
      transactions: response.resources,
    };
  }

  async get(
    transactionId: string,
    userId: string,
  ): Promise<Transaction | undefined> {
    const container = await this.promisedContainer;

    try {
      const { resource } = await container
        .item(transactionId, userId)
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
    userId: string,
  ): Promise<Record<string, Transaction | undefined>> {
    const container = await this.promisedContainer;

    const operations: ReadOperationInput[] = transactionIds.map(
      (transactionId) => {
        return {
          operationType: "Read",
          id: transactionId,
          partitionKey: userId,
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
            "SELECT * FROM c WHERE c.date >= @startDate AND c.date <= @endDate ORDER BY c.date DESC",
          parameters: [
            { name: "@startDate", value: startDateString },
            { name: "@endDate", value: endDateString },
          ],
        },
        {
          partitionKey: userId,
        },
      )
      .fetchAll();

    log.debug(
      {
        userId,
        startDate: startDateString,
        endDate: endDateString,
        count: response.resources.length,
      },
      "fetched transactions for date range",
    );

    return response.resources;
  }

  async delete(transactionId: string, userId: string): Promise<void> {
    const container = await this.promisedContainer;
    await container.item(transactionId, userId).delete();
  }
}
