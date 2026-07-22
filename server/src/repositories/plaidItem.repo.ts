import { Container, StatusCodes } from "@azure/cosmos";
import { DatabaseProvider } from "./database";
import { PlaidItem } from "../models";
import { DatabaseError } from "../common/errors";

const PLAID_ITEM_CONTAINER_ID = "plaid_items";

export class PlaidItemRepository {
  private static instance: PlaidItemRepository;
  private promisedContainer: Promise<Container>;

  constructor() {
    this.promisedContainer = DatabaseProvider.getContainer({
      id: PLAID_ITEM_CONTAINER_ID,
      partitionKey: {
        paths: ["/householdId"],
      },
      indexingPolicy: {
        indexingMode: "consistent",
        automatic: true,
        includedPaths: [
          { path: "/householdId/?" },
          { path: "/userId/?" },
        ],
        excludedPaths: [
          { path: "/*" }, // Exclude everything by default to only index explicitly included properties
        ],
        compositeIndexes: [],
      },
    });
  }

  public static async getInstance(): Promise<PlaidItemRepository> {
    if (!PlaidItemRepository.instance) {
      PlaidItemRepository.instance = new PlaidItemRepository();
    }
    return PlaidItemRepository.instance;
  }

  /**
   * Creates the Plaid item if it doesn't exist, or updates it if it does (e.g. to persist a new
   * sync cursor or error code). The partition key is derived from the document's householdId.
   */
  async upsert(item: PlaidItem): Promise<PlaidItem> {
    const container = await this.promisedContainer;

    const response = await container.items.upsert(item);

    if (
      response.statusCode !== StatusCodes.Ok &&
      response.statusCode !== StatusCodes.Created
    ) {
      throw new DatabaseError(
        `Failed to upsert Plaid item ${response.statusCode}: ${response}`,
      );
    }

    return response.resource as unknown as PlaidItem;
  }

  async findById(itemId: string): Promise<PlaidItem | undefined> {
    const container = await this.promisedContainer;

    const response = await container.items
      .query<PlaidItem>({
        query: "SELECT * FROM c WHERE c.id = @itemId",
        parameters: [{ name: "@itemId", value: itemId }],
      })
      .fetchAll();

    return response.resources[0];
  }

  async listByHousehold(householdId: string): Promise<PlaidItem[]> {
    const container = await this.promisedContainer;

    const response = await container.items
      .query<PlaidItem>(
        {
          query: "SELECT * FROM c WHERE c.householdId = @householdId",
          parameters: [{ name: "@householdId", value: householdId }],
        },
        {
          partitionKey: householdId,
        },
      )
      .fetchAll();

    return response.resources;
  }
}
