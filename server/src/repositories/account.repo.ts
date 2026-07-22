import { Container, StatusCodes } from "@azure/cosmos";
import { Account } from "../models";
import { DatabaseProvider } from "./database";

const ACCOUNT_CONTAINER_ID = "accounts";

export class AccountRepository {
  private static instance: AccountRepository;
  private promisedContainer: Promise<Container>;

  constructor() {
    this.promisedContainer = DatabaseProvider.getContainer({
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
    });
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

    return response.statusCode;
  }

  /**
   * Ensures older account records comply with the current Account interface, writing back the
   * change if necessary. Currently backfills `provider` for legacy (Teller-sourced) rows so that
   * provider-aware logic can rely on the field being present.
   */
  async normalizeAccount(account: Account): Promise<Account> {
    if (account.provider) {
      return account;
    }

    const normalized: Account = { ...account, provider: "teller" };
    console.log(
      `Account ${account.id} is missing 'provider'; backfilling as "teller".`,
    );
    await this.update(normalized);
    return normalized;
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

    const account = response.resources[0];
    return account ? await this.normalizeAccount(account) : undefined;
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

    return await Promise.all(
      response.resources.map((account) => this.normalizeAccount(account)),
    );
  }
}
