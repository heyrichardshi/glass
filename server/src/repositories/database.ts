import {
  CosmosClient,
  Container,
  Database,
  PartitionKeyDefinition,
  IndexingPolicy,
  StatusCodes,
} from "@azure/cosmos";
import { DatabaseError } from "../common/errors";
import { childLogger } from "../common/logger";

const log = childLogger("database");

/**
 * The `userId` every category, tag and merchant is written under for now.
 * No part of the taxonomy is user-scoped yet.
 */
export const DEFAULT_TAXONOMY_USER_ID = "0";

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
   *
   * An existing container whose partition key differs from the definition is rejected rather than
   * adopted; see {@link assertPartitionKeyMatches}.
   */
  public static async getContainer(definition: {
    id: string;
    partitionKey: PartitionKeyDefinition;
    indexingPolicy: IndexingPolicy;
  }): Promise<Container> {
    const provider = await DatabaseProvider.getInstance();
    const database = provider.database;

    const containerRef = database.container(definition.id);

    let containerReadResponse;
    try {
      containerReadResponse = await containerRef.read();
    } catch (err: any) {
      if (err.code !== StatusCodes.NotFound) {
        throw err;
      }

      log.info({ containerId: definition.id }, "container not found; creating");
      const containerCreateResponse =
        await database.containers.createIfNotExists(definition);
      return containerCreateResponse.container;
    }

    // Assert that the resource exists, as if the container didn't exist, read() would throw a 404.
    const existing = containerReadResponse.resource!;
    log.debug({ containerId: definition.id }, "container already exists");

    assertPartitionKeyMatches(
      definition.id,
      definition.partitionKey,
      existing.partitionKey,
    );

    let needsUpdate = false;

    const normalizedExistingPolicy = normalizeIndexingPolicy(
      existing.indexingPolicy,
    );
    const normalizedGivenPolicy = normalizeIndexingPolicy(
      definition.indexingPolicy,
    );

    const stringifiedExistingPolicy = JSON.stringify(normalizedExistingPolicy);
    const stringifiedGivenPolicy = JSON.stringify(normalizedGivenPolicy);

    if (
      definition.indexingPolicy &&
      stringifiedExistingPolicy !== stringifiedGivenPolicy
    ) {
      log.info(
        { containerId: definition.id },
        "indexing policy differs from definition; updating",
      );
      log.debug(
        {
          containerId: definition.id,
          existing: stringifiedExistingPolicy,
          provided: stringifiedGivenPolicy,
        },
        "indexing policy diff",
      );
      existing.indexingPolicy = definition.indexingPolicy;
      needsUpdate = true;
    }

    // Optionally compare/update throughput or other fields here

    if (needsUpdate) {
      log.info({ containerId: definition.id }, "updating container");
      const containerReplaceResponse = await containerRef.replace(existing);
      return containerReplaceResponse.container;
    } else {
      log.debug(
        { containerId: definition.id },
        "container matches given definition",
      );
      return containerReadResponse.container;
    }
  }
}

/**
 * Throws when an existing container whose partition key differs from the definition.
 */
function assertPartitionKeyMatches(
  containerId: string,
  expected: PartitionKeyDefinition,
  actual?: PartitionKeyDefinition,
): void {
  const expectedPaths = expected?.paths ?? [];
  const actualPaths = actual?.paths ?? [];

  const matches =
    expectedPaths.length === actualPaths.length &&
    expectedPaths.every((path, index) => path === actualPaths[index]);

  if (matches) {
    return;
  }

  throw new DatabaseError(
    `Container '${containerId}' is partitioned on [${actualPaths.join(", ")}] ` +
      `but its definition requires [${expectedPaths.join(", ")}]. A partition key cannot be ` +
      `changed after creation, so the container must be deleted and recreated.`,
  );
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
