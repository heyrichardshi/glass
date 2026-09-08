import { Container, StatusCodes } from "@azure/cosmos";
import { childLogger } from "../common/logger";
import { Account } from "../models";
import { DatabaseProvider } from "./database";

const log = childLogger("account.repo");

const ACCOUNT_CONTAINER_ID = "accounts";

export class AccountRepository {
  private static instance: AccountRepository;
  private promisedContainer: Promise<Container>;

  constructor() {
    this.promisedContainer = DatabaseProvider.getContainer({
      id: ACCOUNT_CONTAINER_ID,
      partitionKey: {
        paths: ["/userId"],
      },
      indexingPolicy: {
        indexingMode: "consistent",
        automatic: true,
        includedPaths: [
          { path: "/status/?" },
          { path: "/isDeleted/?" },
          { path: "/plaidItemId/?" },
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
    log.info(
      {
        accountId: account.id,
        userId: account.userId,
        statusCode: response.statusCode,
      },
      "created account",
    );

    return response.statusCode;
  }

  async update(account: Account): Promise<number> {
    const container = await this.promisedContainer;

    const item = container.item(account.id, account.userId);

    if (!item) {
      log.info({ accountId: account.id }, "account not found");
      return StatusCodes.NotFound;
    }

    const response = await item.replace(account);

    return response.statusCode;
  }

  /**
   * Takes the owner rather than the account ID alone: without it this reads across every
   * partition and can return an account belonging to someone else.
   */
  async findById(
    accountId: string,
    userId: string,
  ): Promise<Account | undefined> {
    const container = await this.promisedContainer;

    try {
      const { resource } = await container
        .item(accountId, userId)
        .read<Account>();
      return resource;
    } catch (err: any) {
      if (err.code === StatusCodes.NotFound) {
        return undefined;
      }
      throw err;
    }
  }

  // List all accounts for given user
  async listByUser(userId: string): Promise<Account[]> {
    const container = await this.promisedContainer;

    const response = await container.items
      .query<Account>("SELECT * FROM c", { partitionKey: userId })
      .fetchAll();

    return response.resources;
  }
}
