import { Container, StatusCodes } from "@azure/cosmos";
import { DatabaseProvider } from "./database";
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
        paths: ["/householdId"],
      },
      indexingPolicy: {
        indexingMode: "consistent",
        automatic: true,
        includedPaths: [{ path: "/householdId/?" }, { path: "/name/?" }],
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

  async findById(tagId: string, householdId: string): Promise<Tag | undefined> {
    const container = await this.promisedContainer;

    try {
      const { resource } = await container.item(tagId, householdId).read<Tag>();
      return resource;
    } catch (err: any) {
      if (err.code === 404) {
        return undefined;
      }
      throw err;
    }
  }

  async upsert(tag: Tag): Promise<Tag> {
    const container = await this.promisedContainer;

    const response = await container.items.upsert(tag);

    if (
      response.statusCode !== StatusCodes.Ok &&
      response.statusCode !== StatusCodes.Created
    ) {
      throw new DatabaseError(
        `Failed to upsert tag ${response.statusCode}: ${response}`,
      );
    }

    console.log(
      `Upserted tag in db with status ${response.statusCode}: `,
      response,
    );
    return response.resource as unknown as Tag;
  }

  async listAll(householdId: string): Promise<Tag[]> {
    const container = await this.promisedContainer;

    const response = await container.items
      .query<Tag>(
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

  async findByName(
    householdId: string,
    tagName: string,
  ): Promise<Tag | undefined> {
    const container = await this.promisedContainer;

    const response = await container.items
      .query<Tag>(
        {
          query:
            "SELECT * FROM c WHERE c.householdId = @householdId AND c.name = @name",
          parameters: [
            { name: "@householdId", value: householdId },
            { name: "@name", value: tagName },
          ],
        },
        {
          partitionKey: householdId,
        },
      )
      .fetchAll();

    if (response.resources.length === 0) {
      return undefined;
    }

    return response.resources[0];
  }
}
