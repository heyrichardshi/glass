import {
  CreateMerchantRequest,
  CreateMerchantResponse,
  ListMerchantsRequest,
  ListMerchantsResponse,
} from "@saffron/types";
import { CategoryRepository, MerchantRepository } from "../repositories";
import { Merchant } from "../models";
import { ConflictError, NotFoundError } from "../common/errors";
import { randomUUID } from "crypto";
import { toApiMerchant } from "../models/api";

export async function listMerchants(
  request: ListMerchantsRequest,
): Promise<ListMerchantsResponse> {
  const merchantRepository = await MerchantRepository.getInstance();
  const merchants = await merchantRepository.listAll(request.householdId);
  return {
    merchants: merchants.map(toApiMerchant),
  };
}

export async function createMerchant(
  request: CreateMerchantRequest,
): Promise<CreateMerchantResponse> {
  const merchantRepository = await MerchantRepository.getInstance();

  // Check if merchant with same name already exists
  const existingMerchant = await merchantRepository.getByName(
    request.name.toLowerCase(),
    request.householdId,
  );
  if (existingMerchant) {
    throw new ConflictError("Merchant", request.name);
  }

  // Check if given default category exists
  const categoryRepository = await CategoryRepository.getInstance();
  const category = await categoryRepository.findById(
    request.defaultCategoryId,
    request.householdId,
  );
  if (!category) {
    throw new NotFoundError(
      `Category with ID'${request.defaultCategoryId}' not found.`,
    );
  }

  const merchant: Merchant = {
    id: randomUUID(),
    name: request.name,
    householdId: request.householdId,
    defaultCategoryId: request.defaultCategoryId,
    descriptionMatchers: request.descriptionMatchers,
  };

  const createdMerchant = await merchantRepository.create(merchant);

  return {
    merchant: toApiMerchant(createdMerchant),
  };
}
