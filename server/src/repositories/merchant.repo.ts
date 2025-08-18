import { Container, StatusCodes } from "@azure/cosmos";
import { DatabaseProvider } from "./database";
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
        paths: ["/householdId"],
      },
      indexingPolicy: {
        indexingMode: "consistent",
        automatic: true,
        includedPaths: [
          { path: "/householdId/?" },
          { path: "/name/?" },
          { path: "/isDeleted/?" },
        ],
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

  async create(merchant: Merchant): Promise<Merchant> {
    const container = await this.promisedContainer;

    const response = await container.items.create(merchant);

    if (response.statusCode !== StatusCodes.Created) {
      throw new DatabaseError(
        `Failed to create merchant ${response.statusCode}: ${response}`,
      );
    }

    return response.resource as unknown as Merchant;
  }

  async listAll(householdId: string): Promise<Merchant[]> {
    const container = await this.promisedContainer;

    const response = await container.items
      .query<Merchant>(
        {
          query:
            "SELECT * FROM c WHERE c.householdId = @householdId ORDER BY c.name ASC",
          parameters: [{ name: "@householdId", value: householdId }],
        },
        {
          partitionKey: householdId,
        },
      )
      .fetchAll();

    console.log(
      `Fetched ${response.resources.length} merchants for household ${householdId}`,
    );

    return response.resources;
  }

  async get(
    merchantId: string,
    householdId: string,
  ): Promise<Merchant | undefined> {
    const container = await this.promisedContainer;

    try {
      const { resource } = await container
        .item(merchantId, householdId)
        .read<Merchant>();
      return resource;
    } catch (err: any) {
      if (err.code === 404) {
        return undefined;
      }
      throw err;
    }
  }

  async getByName(
    merchantName: string,
    householdId: string,
  ): Promise<Merchant | undefined> {
    const container = await this.promisedContainer;

    const response = await container.items
      .query<Merchant>(
        {
          query:
            "SELECT * FROM c WHERE c.householdId = @householdId AND c.name = @name",
          parameters: [
            { name: "@householdId", value: householdId },
            { name: "@name", value: merchantName },
          ],
        },
        {
          partitionKey: householdId,
        },
      )
      .fetchAll();

    console.log(
      `Fetched ${response.resources.length} merchants with name ${merchantName} for household ${householdId}`,
    );

    if (response.resources.length === 0) {
      return undefined;
    }

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

  async delete(merchantId: string, householdId: string): Promise<void> {
    const container = await this.promisedContainer;
    await container.item(merchantId, householdId).delete();
  }
}
