import { CosmosClient, Container, Database } from "@azure/cosmos";

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

  public getDatabase(): Database {
    return this.database;
  }
}
