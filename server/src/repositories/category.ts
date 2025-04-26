import { Container, SqlQuerySpec, StatusCodes } from "@azure/cosmos";
import { DatabaseProvider } from "./database";
import { Category } from "../models";
import { getDefaultCategories } from "../models/category";
import { DatabaseError } from "../common/errors";

const CATEGORY_CONTAINER_ID = "categories";

export class CategoryRepository {
  private static instance: CategoryRepository;
  private promisedContainer: Promise<Container>;

  constructor() {
    this.promisedContainer = DatabaseProvider.getContainer({
      id: CATEGORY_CONTAINER_ID,
      partitionKey: {
        paths: ["/householdId"],
      },
      indexingPolicy: {
        indexingMode: "consistent",
        automatic: true,
        includedPaths: [{ path: "/householdId/?" }, { path: "/fullPath/?" }],
        excludedPaths: [
          { path: "/*" }, // Exclude everything by default to only index explicitly included properties
        ],
        compositeIndexes: [],
      },
    });
  }

  public static async getInstance(): Promise<CategoryRepository> {
    if (!CategoryRepository.instance) {
      CategoryRepository.instance = new CategoryRepository();
    }
    return CategoryRepository.instance;
  }

  private async initializeDefaultCategories(householdId: string) {
    const defaultCategories = getDefaultCategories(householdId);
    for (const category of defaultCategories) {
      const existing = await this.findById(category.id, householdId);
      if (!existing) {
        console.log(
          `Creating missing category: ${category.id} (${category.name})`,
        );
        await this.upsert(category);
      } else {
        console.log(
          `Category already exists: ${category.id} (${category.name})`,
        );
      }
    }
  }

  async findById(
    categoryId: string,
    householdId: string,
  ): Promise<Category | undefined> {
    const container = await this.promisedContainer;

    try {
      const { resource } = await container
        .item(categoryId, householdId)
        .read<Category>();
      return resource;
    } catch (err: any) {
      if (err.code === 404) {
        return undefined;
      }
      throw err;
    }
  }

  async upsert(category: Category): Promise<Category> {
    const container = await this.promisedContainer;

    const response = await container.items.upsert(category);

    if (
      response.statusCode !== StatusCodes.Ok &&
      response.statusCode !== StatusCodes.Created
    ) {
      throw new DatabaseError(
        `Failed to upsert category ${response.statusCode}: ${response}`,
      );
    }

    console.log(
      `Upserted category in db with status ${response.statusCode}: `,
      response,
    );
    return response.resource as unknown as Category;
  }

  async listAll(householdId: string): Promise<Category[]> {
    await this.initializeDefaultCategories(householdId);

    const container = await this.promisedContainer;

    const response = await container.items
      .query<Category>(
        {
          query: "SELECT * FROM c WHERE c.householdId = @householdId",
          parameters: [{ name: "@householdId", value: householdId }],
        },
        {
          partitionKey: householdId,
        },
      )
      .fetchAll();

    console.log(
      `Fetched ${response.resources.length} categories for householdId ${householdId} from db: `,
      response,
    );

    return response.resources;
  }

  async listAllDirectChildren(
    householdId: string,
    parentId?: string,
  ): Promise<Category[]> {
    const container = await this.promisedContainer;

    let query: SqlQuerySpec;
    if (parentId) {
      query = {
        query:
          "SELECT * FROM c WHERE c.householdId = @householdId AND c.parentId = @parentId",
        parameters: [
          { name: "@householdId", value: householdId },
          { name: "@parentId", value: parentId },
        ],
      };
    } else {
      // If no parentId is provided, we want to fetch all root categories
      query = {
        query:
          "SELECT * FROM c WHERE c.householdId = @householdId AND (c.parentId = null OR NOT IS_DEFINED(c.parentId))",
        parameters: [{ name: "@householdId", value: householdId }],
      };
    }

    const response = await container.items
      .query<Category>(query, {
        partitionKey: householdId,
      })
      .fetchAll();

    console.log(
      `Fetched ${response.resources.length} categories for householdId '${householdId}' with parentId '${parentId}' from db: `,
      response,
    );

    return response.resources;
  }
}
