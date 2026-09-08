import { Container, SqlQuerySpec, StatusCodes } from "@azure/cosmos";
import { DatabaseProvider, DEFAULT_TAXONOMY_USER_ID } from "./database";
import { Category } from "../models";
import { getDefaultCategories } from "../models/category";
import { DatabaseError } from "../common/errors";
import { childLogger } from "../common/logger";

const log = childLogger("category.repo");

const CATEGORY_CONTAINER_ID = "categories";

/**
 * Creates whichever default categories are absent. This runs once per process as part of setting
 * the container up, rather than on every read, and leaves existing rows alone so that repeating it
 * across restarts is harmless.
 */
async function seedDefaultCategories(container: Container): Promise<void> {
  const { resources: existing } = await container.items
    .query<{ id: string }>("SELECT c.id FROM c", {
      partitionKey: DEFAULT_TAXONOMY_USER_ID,
    })
    .fetchAll();

  const existingIds = new Set(existing.map((category) => category.id));
  const missing = getDefaultCategories().filter(
    (category) => !existingIds.has(category.id),
  );

  if (missing.length === 0) {
    return;
  }

  log.info(
    { count: missing.length, names: missing.map((category) => category.name) },
    "creating missing default categories",
  );

  await Promise.all(
    missing.map((category) =>
      container.items.upsert<Category>({
        ...category,
        userId: DEFAULT_TAXONOMY_USER_ID,
      }),
    ),
  );
}

export class CategoryRepository {
  private static instance: CategoryRepository;
  private promisedContainer: Promise<Container>;

  constructor() {
    this.promisedContainer = DatabaseProvider.getContainer({
      id: CATEGORY_CONTAINER_ID,
      partitionKey: {
        paths: ["/userId"],
      },
      indexingPolicy: {
        indexingMode: "consistent",
        automatic: true,
        includedPaths: [{ path: "/fullPath/?" }, { path: "/parentId/?" }],
        excludedPaths: [
          { path: "/*" }, // Exclude everything by default to only index explicitly included properties
        ],
        compositeIndexes: [],
      },
    }).then(async (container) => {
      await seedDefaultCategories(container);
      return container;
    });
  }

  public static async getInstance(): Promise<CategoryRepository> {
    if (!CategoryRepository.instance) {
      CategoryRepository.instance = new CategoryRepository();
    }
    return CategoryRepository.instance;
  }

  async findById(categoryId: string): Promise<Category | undefined> {
    const container = await this.promisedContainer;

    try {
      const { resource } = await container
        .item(categoryId, DEFAULT_TAXONOMY_USER_ID)
        .read<Category>();
      return resource;
    } catch (err: any) {
      if (err.code === StatusCodes.NotFound) {
        return undefined;
      }
      throw err;
    }
  }

  async upsert(category: Omit<Category, "userId">): Promise<Category> {
    const container = await this.promisedContainer;

    const response = await container.items.upsert<Category>({
      ...category,
      userId: DEFAULT_TAXONOMY_USER_ID,
    });

    if (
      response.statusCode !== StatusCodes.Ok &&
      response.statusCode !== StatusCodes.Created
    ) {
      throw new DatabaseError(
        `Failed to upsert category ${response.statusCode}: ${response}`,
      );
    }

    return response.resource as unknown as Category;
  }

  async listAll(): Promise<Category[]> {
    const container = await this.promisedContainer;

    const response = await container.items
      .query<Category>("SELECT * FROM c", {
        partitionKey: DEFAULT_TAXONOMY_USER_ID,
      })
      .fetchAll();

    return response.resources;
  }

  async listAllDirectChildren(parentId?: string): Promise<Category[]> {
    const container = await this.promisedContainer;

    let query: SqlQuerySpec;
    if (parentId) {
      query = {
        query: "SELECT * FROM c WHERE c.parentId = @parentId",
        parameters: [{ name: "@parentId", value: parentId }],
      };
    } else {
      // If no parentId is provided, we want to fetch all root categories
      query = {
        query:
          "SELECT * FROM c WHERE c.parentId = null OR NOT IS_DEFINED(c.parentId)",
        parameters: [],
      };
    }

    const response = await container.items
      .query<Category>(query, { partitionKey: DEFAULT_TAXONOMY_USER_ID })
      .fetchAll();

    return response.resources;
  }
}
