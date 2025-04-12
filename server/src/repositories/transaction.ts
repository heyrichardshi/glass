import { Container } from "@azure/cosmos";
import { Transaction, TransactionsList } from "../models";
import { DatabaseProvider } from "./database";

const TRANSACTION_CONTAINER_ID = "transactions";

export class TransactionRepository {
  private static instance: TransactionRepository;
  private promisedContainer: Promise<Container>;

  constructor() {
    this.promisedContainer = DatabaseProvider.getInstance()
      .then((provider) => provider.getDatabase())
      .then((db) =>
        db.containers.createIfNotExists({
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
        }),
      )
      .then((res) => res.container);
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
  async upsert(transaction: Transaction): Promise<number> {
    const container = await this.promisedContainer;

    const response = await container.items.upsert(transaction);
    // console.log('Upserted transaction in db: ', response);

    return response.statusCode;
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
          // TODO: need to update this to hosueholdId once households are implemented; currently all hosueholds are = userId
          partitionKey: userId,
          maxItemCount: 50,
          continuationToken: paginationToken,
        },
      )
      .fetchNext();
    console.log(
      `Fetched ${response.resources.length} transactions for user ${userId} with pagination token ${paginationToken}, got next pagination token: ${response.continuationToken}`,
    );

    return {
      transactions: response.resources,
      paginationToken: response.continuationToken,
    };
  }
}
