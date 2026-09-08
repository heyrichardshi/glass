import {
  CreateMerchantResponse,
  ListMerchantsResponse,
  UpdateMerchantResponse,
} from "@glass/types";
import { ApplyAllMatchersResponse } from "@glass/types/schemas";
import {
  CategoryRepository,
  MerchantRepository,
  TransactionRepository,
} from "../repositories";
import { Merchant } from "../models";
import { ConflictError, NotFoundError } from "../common/errors";
import { randomUUID } from "crypto";
import { toApiMerchant } from "../models/api";
import { findFirstMatchingMerchant } from "../common/merchant-utils";

export interface CreateMerchantRequest {
  name: string;
  defaultCategoryId: string;
  descriptionMatchers: string[];
}

export interface UpdateMerchantRequest {
  name?: string;
  defaultCategoryId?: string;
  descriptionMatchers?: string[];
}

export async function listMerchants(): Promise<ListMerchantsResponse> {
  const merchantRepository = await MerchantRepository.getInstance();
  const merchants = await merchantRepository.listAll();
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
  );
  if (existingMerchant) {
    throw new ConflictError(
      `Merchant with name '${request.name}' already exists.`,
    );
  }

  // Check if given default category exists
  const categoryRepository = await CategoryRepository.getInstance();
  const category = await categoryRepository.findById(request.defaultCategoryId);
  if (!category) {
    throw new NotFoundError(
      `Category with ID'${request.defaultCategoryId}' not found.`,
    );
  }

  const createdMerchant = await merchantRepository.create({
    id: randomUUID(),
    name: request.name,
    defaultCategoryId: request.defaultCategoryId,
    descriptionMatchers: request.descriptionMatchers,
  });

  return {
    merchant: toApiMerchant(createdMerchant),
  };
}

export async function updateMerchant(
  merchantId: string,
  request: UpdateMerchantRequest,
): Promise<UpdateMerchantResponse> {
  const merchantRepository = await MerchantRepository.getInstance();
  const categoryRepository = await CategoryRepository.getInstance();

  // Get the existing merchant
  const existingMerchant = await merchantRepository.get(merchantId);
  if (!existingMerchant) {
    throw new NotFoundError(`Merchant with ID '${merchantId}' not found.`);
  }

  // Check if name is being changed and if it conflicts with existing merchant
  if (request.name && request.name !== existingMerchant.name) {
    const conflictingMerchant = await merchantRepository.getByName(
      request.name.toLowerCase(),
    );
    if (conflictingMerchant && conflictingMerchant.id !== merchantId) {
      throw new ConflictError(
        `Merchant with name '${request.name}' already exists.`,
      );
    }
  }

  // Check if default category is being changed and if it exists
  if (
    request.defaultCategoryId &&
    request.defaultCategoryId !== existingMerchant.defaultCategoryId
  ) {
    const category = await categoryRepository.findById(
      request.defaultCategoryId,
    );
    if (!category) {
      throw new NotFoundError(
        `Category with ID '${request.defaultCategoryId}' not found.`,
      );
    }
  }

  // Update the merchant with new values
  const updatedMerchant: Merchant = {
    ...existingMerchant,
    name: request.name || existingMerchant.name,
    defaultCategoryId:
      request.defaultCategoryId || existingMerchant.defaultCategoryId,
    descriptionMatchers:
      request.descriptionMatchers || existingMerchant.descriptionMatchers,
  };

  const savedMerchant = await merchantRepository.update(updatedMerchant);

  return {
    merchant: toApiMerchant(savedMerchant),
  };
}

export interface ApplyAllMatchersRequest {
  /** Whose transactions to re-match. The merchants themselves are shared. */
  userId: string;
  overrideExistingMerchants: boolean;
  overrideExistingCategories: boolean;
}

export async function applyAllMatchers(
  request: ApplyAllMatchersRequest,
): Promise<ApplyAllMatchersResponse> {
  const merchantRepo = await MerchantRepository.getInstance();
  const transactionRepo = await TransactionRepository.getInstance();

  const merchants = await merchantRepo.listAll();

  let retaggedCount = 0;
  let paginationToken: string | undefined;

  do {
    const page = await transactionRepo.listTransactionsByUser(
      request.userId,
      paginationToken,
    );

    for (const transaction of page.transactions) {
      const alreadyHasMerchant = transaction.counterparty.id !== "0";
      if (alreadyHasMerchant && !request.overrideExistingMerchants) {
        continue;
      }

      const matchedMerchant = findFirstMatchingMerchant(
        transaction.rawDescription,
        merchants,
      );
      if (!matchedMerchant) continue;

      const merchantUnchanged =
        transaction.counterparty.id === matchedMerchant.id;
      const categoryUnchanged =
        transaction.categoryId === matchedMerchant.defaultCategoryId;
      if (
        merchantUnchanged &&
        (!request.overrideExistingCategories || categoryUnchanged)
      ) {
        continue;
      }

      transaction.counterparty = { id: matchedMerchant.id, type: "merchant" };
      if (request.overrideExistingCategories) {
        transaction.categoryId = matchedMerchant.defaultCategoryId;
      }

      await transactionRepo.upsert(transaction);
      retaggedCount++;
    }

    paginationToken = page.paginationToken;
  } while (paginationToken);

  return { retaggedCount };
}
