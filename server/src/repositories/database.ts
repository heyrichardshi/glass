import {
  CosmosClient,
  Container,
  Database,
  PartitionKeyDefinition,
  IndexingPolicy,
  StatusCodes,
} from "@azure/cosmos";

export class DatabaseProvider {
  private static instance: DatabaseProvider;
  private client: CosmosClient;
  private database!: Database;

  private constructor() {
    const endpoint = process.env.COSMOS_DB_ENDPOINT!;
    const key = process.env.COSMOS_DB_KEY!;
    // const databaseId = process.env.COSMOS_DB_NAME!;

    this.client = new CosmosClient({ endpoint, key });
  }

  private static async initialize(): Promise<DatabaseProvider> {
    const instance = new DatabaseProvider();

    const databaseId = process.env.COSMOS_DB_NAME!;
    const { database } = await instance.client.databases.createIfNotExists({
      id: databaseId,
    });

    instance.database = database;

    return instance;
  }

  public static async getInstance(): Promise<DatabaseProvider> {
    if (!DatabaseProvider.instance) {
      DatabaseProvider.instance = await DatabaseProvider.initialize();
    }
    return DatabaseProvider.instance;
  }

  /**
   * This method creates a container if it doesn't exist, or updates its indexing policy if it does.
   * It then returns a promise that resolves to the container.
   */
  public static async getContainer(definition: {
    id: string;
    partitionKey: PartitionKeyDefinition;
    indexingPolicy: IndexingPolicy;
  }): Promise<Container> {
    const provider = await DatabaseProvider.getInstance();
    const database = provider.database;

    const containerRef = database.container(definition.id);

    try {
      let needsUpdate = false;
      const containerReadResponse = await containerRef.read();

      // Assert that the resource exists, as if the container didn't exist, read() would throw a 404.
      const existing = containerReadResponse.resource!;
      console.log(`Container '${definition.id}' already exists.`);

      const normalizedExistingPolicy = normalizeIndexingPolicy(
        existing.indexingPolicy,
      );
      const normalizedGivenPolicy = normalizeIndexingPolicy(
        definition.indexingPolicy,
      );

      const stringifiedExistingPolicy = JSON.stringify(
        normalizedExistingPolicy,
      );
      const stringifiedGivenPolicy = JSON.stringify(normalizedGivenPolicy);

      if (
        definition.indexingPolicy &&
        stringifiedExistingPolicy !== stringifiedGivenPolicy
      ) {
        console.log(
          `Existing indexing policy differs from provided definition:\n==EXISTING==\n${stringifiedExistingPolicy}\n==PROVIDED==\n${stringifiedGivenPolicy}`,
        );
        existing.indexingPolicy = definition.indexingPolicy;
        needsUpdate = true;
      }

      // Optionally compare/update throughput or other fields here

      if (needsUpdate) {
        console.log(`Updating container '${definition.id}'.`);
        const containerReplaceResponse = await containerRef.replace(existing);
        return containerReplaceResponse.container;
      } else {
        console.log(`Container '${definition.id}' matches given definition.`);
        return containerReadResponse.container;
      }
    } catch (err: any) {
      console.log(err);
      if (err.code === StatusCodes.NotFound) {
        console.log(
          `Container '${definition.id}' was not found, creating container.`,
        );
        const containerCreateResponse =
          await database.containers.createIfNotExists(definition);
        return containerCreateResponse.container;
      } else {
        throw err;
      }
    }
  }
}

function normalizeIndexingPolicy(policy?: IndexingPolicy): IndexingPolicy {
  // Create a deep copy of the policy
  const copy = JSON.parse(JSON.stringify(policy || {}));

  // Sort includedPaths and excludedPaths for consistent order
  copy.includedPaths = (copy.includedPaths || []).sort((a: any, b: any) =>
    a.path.localeCompare(b.path),
  );
  copy.excludedPaths = (copy.excludedPaths || [])
    .filter((p: any) => p.path !== '/"_etag"/?') // filter out auto-injected _etag
    .sort((a: any, b: any) => a.path.localeCompare(b.path));

  // Normalize compositeIndexes to be [] if undefined
  copy.compositeIndexes = copy.compositeIndexes || [];

  return copy;
}
