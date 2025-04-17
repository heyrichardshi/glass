import { Container, StatusCodes } from "@azure/cosmos";
import { Account } from "../models";
import { DatabaseProvider } from "./database";

const ACCOUNT_CONTAINER_ID = "accounts";

export class AccountRepository {
  private static instance: AccountRepository;
  private promisedContainer: Promise<Container>;

  constructor() {
    this.promisedContainer = DatabaseProvider.getInstance()
      .then((provider) => provider.getDatabase())
      .then((db) =>
        db.containers.createIfNotExists({
          id: ACCOUNT_CONTAINER_ID,
          partitionKey: {
            paths: ["/householdId"],
          },
          indexingPolicy: {
            indexingMode: "consistent",
            automatic: true,
            includedPaths: [
              { path: "/userId/?" },
              { path: "/householdId/?" },
              { path: "/status/?" },
              { path: "/isDeleted/?" },
            ],
            excludedPaths: [
              { path: "/*" }, // Exclude everything by default to only index explicitly included properties
            ],
            compositeIndexes: [],
          },
        }),
      )
      .then((res) => res.container);
  }

  public static async getInstance(): Promise<AccountRepository> {
    if (!AccountRepository.instance) {
      AccountRepository.instance = new AccountRepository();
    }
    return AccountRepository.instance;
  }

  async create(account: Account): Promise<number> {
    const container = await this.promisedContainer;

    const response = await container.items.create(account);
    console.log("Created account in db: ", response);

    return response.statusCode;
  }

  async update(account: Account): Promise<number> {
    const container = await this.promisedContainer;

    const item = container.item(account.id, account.userId);

    if (!item) {
      console.log(`Account ${account.id} not found in db.`);
      return StatusCodes.NotFound;
    }

    const response = await item.replace(account);
    console.log("Updated account in db: ", response);

    return response.statusCode;
  }

  // Find an account by ID
  async findById(accountId: string): Promise<Account | undefined> {
    const container = await this.promisedContainer;

    const response = await container.items
      .query<Account>({
        query: "SELECT * FROM c WHERE c.id = @accountId",
        parameters: [{ name: "@accountId", value: accountId }],
      })
      .fetchAll();
    console.log("Fetching account ", accountId, " from db: ", response);

    return response.resources[0];
  }

  // List all accounts for given user
  async listByUser(userId: string): Promise<Account[]> {
    const container = await this.promisedContainer;

    const response = await container.items
      .query<Account>(
        {
          query: "SELECT * FROM c WHERE c.userId = @userId",
          parameters: [{ name: "@userId", value: userId }],
        },
        {
          // TODO: need to update this to hosueholdId once households are implemented; currently all hosueholds are = userId
          partitionKey: userId,
        },
      )
      .fetchAll();
    console.log(
      `Fetched ${response.resources.length} accounts for user ${userId} from db: `,
      response,
    );

    return response.resources;
  }
}
