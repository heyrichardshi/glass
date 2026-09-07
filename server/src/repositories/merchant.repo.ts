import { Container, StatusCodes } from "@azure/cosmos";
import { DatabaseProvider, DEFAULT_TAXONOMY_USER_ID } from "./database";
import { Merchant } from "../models";
import { DatabaseError } from "../common/errors";

const MERCHANT_CONTAINER_ID = "merchants";

export class MerchantRepository {
  private static instance: MerchantRepository;
  private promisedContainer: Promise<Container>;

  constructor() {
    this.promisedContainer = DatabaseProvider.getContainer({
      id: MERCHANT_CONTAINER_ID,
      partitionKey: {
        paths: ["/userId"],
      },
      indexingPolicy: {
        indexingMode: "consistent",
        automatic: true,
        includedPaths: [{ path: "/name/?" }, { path: "/isDeleted/?" }],
        excludedPaths: [
          { path: "/*" }, // Exclude everything by default to only index explicitly included properties
        ],
        compositeIndexes: [],
      },
    });
  }

  public static async getInstance(): Promise<MerchantRepository> {
    if (!MerchantRepository.instance) {
      MerchantRepository.instance = new MerchantRepository();
    }
    return MerchantRepository.instance;
  }

  async create(merchant: Omit<Merchant, "userId">): Promise<Merchant> {
    const container = await this.promisedContainer;

    const response = await container.items.create<Merchant>({
      ...merchant,
      userId: DEFAULT_TAXONOMY_USER_ID,
    });

    if (response.statusCode !== StatusCodes.Created) {
      throw new DatabaseError(
        `Failed to create merchant ${response.statusCode}: ${response}`,
      );
    }

    return response.resource as unknown as Merchant;
  }

  async listAll(): Promise<Merchant[]> {
    const container = await this.promisedContainer;

    const response = await container.items
      .query<Merchant>("SELECT * FROM c ORDER BY c.name ASC", {
        partitionKey: DEFAULT_TAXONOMY_USER_ID,
      })
      .fetchAll();

    return response.resources;
  }

  async get(merchantId: string): Promise<Merchant | undefined> {
    const container = await this.promisedContainer;

    try {
      const { resource } = await container
        .item(merchantId, DEFAULT_TAXONOMY_USER_ID)
        .read<Merchant>();
      return resource;
    } catch (err: any) {
      if (err.code === StatusCodes.NotFound) {
        return undefined;
      }
      throw err;
    }
  }

  async getByName(merchantName: string): Promise<Merchant | undefined> {
    const container = await this.promisedContainer;

    const response = await container.items
      .query<Merchant>(
        {
          query: "SELECT * FROM c WHERE c.name = @name",
          parameters: [{ name: "@name", value: merchantName }],
        },
        {
          partitionKey: DEFAULT_TAXONOMY_USER_ID,
        },
      )
      .fetchAll();

    return response.resources[0];
  }

  async update(merchant: Merchant): Promise<Merchant> {
    const container = await this.promisedContainer;

    const response = await container.items.upsert(merchant);

    if (response.statusCode !== StatusCodes.Ok) {
      throw new DatabaseError(
        `Failed to update merchant ${response.statusCode}: ${response}`,
      );
    }

    return response.resource as unknown as Merchant;
  }

  async delete(merchantId: string): Promise<void> {
    const container = await this.promisedContainer;
    await container.item(merchantId, DEFAULT_TAXONOMY_USER_ID).delete();
  }
}
