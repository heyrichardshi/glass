import { Container, StatusCodes } from "@azure/cosmos";
import { DatabaseProvider, DEFAULT_TAXONOMY_USER_ID } from "./database";
import { Tag } from "../models";
import { DatabaseError } from "../common/errors";

const TAG_CONTAINER_ID = "tags";

export class TagRepository {
  private static instance: TagRepository;
  private promisedContainer: Promise<Container>;

  constructor() {
    this.promisedContainer = DatabaseProvider.getContainer({
      id: TAG_CONTAINER_ID,
      partitionKey: {
        paths: ["/userId"],
      },
      indexingPolicy: {
        indexingMode: "consistent",
        automatic: true,
        includedPaths: [{ path: "/name/?" }],
        excludedPaths: [
          { path: "/*" }, // Exclude everything by default to only index explicitly included properties
        ],
        compositeIndexes: [],
      },
    });
  }

  public static async getInstance(): Promise<TagRepository> {
    if (!TagRepository.instance) {
      TagRepository.instance = new TagRepository();
    }
    return TagRepository.instance;
  }

  async findById(tagId: string): Promise<Tag | undefined> {
    const container = await this.promisedContainer;

    try {
      const { resource } = await container
        .item(tagId, DEFAULT_TAXONOMY_USER_ID)
        .read<Tag>();
      return resource;
    } catch (err: any) {
      if (err.code === StatusCodes.NotFound) {
        return undefined;
      }
      throw err;
    }
  }

  async upsert(tag: Omit<Tag, "userId">): Promise<Tag> {
    const container = await this.promisedContainer;

    const response = await container.items.upsert<Tag>({
      ...tag,
      userId: DEFAULT_TAXONOMY_USER_ID,
    });

    if (
      response.statusCode !== StatusCodes.Ok &&
      response.statusCode !== StatusCodes.Created
    ) {
      throw new DatabaseError(
        `Failed to upsert tag ${response.statusCode}: ${response}`,
      );
    }

    return response.resource as unknown as Tag;
  }

  async listAll(): Promise<Tag[]> {
    const container = await this.promisedContainer;

    const response = await container.items
      .query<Tag>("SELECT * FROM c", { partitionKey: DEFAULT_TAXONOMY_USER_ID })
      .fetchAll();

    return response.resources;
  }

  async findByName(tagName: string): Promise<Tag | undefined> {
    const container = await this.promisedContainer;

    const response = await container.items
      .query<Tag>(
        {
          query: "SELECT * FROM c WHERE c.name = @name",
          parameters: [{ name: "@name", value: tagName }],
        },
        {
          partitionKey: DEFAULT_TAXONOMY_USER_ID,
        },
      )
      .fetchAll();

    return response.resources[0];
  }
}
