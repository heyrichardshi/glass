import * as merchants from "../services/merchant.service";
import asyncController, { NoBody, NoParams, NoQuery } from "./asyncController";
import {
  ApplyAllMatchersBody,
  ApplyAllMatchersResponse,
  CreateMerchantBody,
  CreateMerchantResponse,
  ListMerchantsQuery,
  ListMerchantsResponse,
  UpdateMerchantBody,
  UpdateMerchantResponse,
} from "@saffron/types/schemas";

export const listMerchants = asyncController<
  NoParams,
  ListMerchantsQuery,
  NoBody,
  ListMerchantsResponse
>(async (req, res) => {
  const { householdId } = req.query;

  const merchantsList = await merchants.listMerchants({
    householdId: householdId,
  });
  res.status(200).json(merchantsList);
});

export const createMerchant = asyncController<
  NoParams,
  NoQuery,
  CreateMerchantBody,
  CreateMerchantResponse
>(async (req, res) => {
  const { householdId, name, defaultCategoryId, descriptionMatchers } =
    req.body;

  const merchant = await merchants.createMerchant({
    householdId,
    name,
    defaultCategoryId,
    descriptionMatchers: descriptionMatchers || [],
  });

  res.status(201).json(merchant);
});

export const updateMerchant = asyncController<
  NoParams,
  NoQuery,
  UpdateMerchantBody,
  UpdateMerchantResponse
>(async (req, res) => {
  const { householdId, name, defaultCategoryId, descriptionMatchers } =
    req.body;
  const merchantId = req.params.merchantId;

  const merchant = await merchants.updateMerchant(merchantId, {
    householdId,
    name,
    defaultCategoryId,
    descriptionMatchers,
  });

  res.status(200).json(merchant);
});

export const applyAllMatchers = asyncController<
  NoParams,
  NoQuery,
  ApplyAllMatchersBody,
  ApplyAllMatchersResponse
>(async (req, res) => {
  const { householdId, overrideExistingMerchants, overrideExistingCategories } =
    req.body;

  const result = await merchants.applyAllMatchers({
    householdId,
    overrideExistingMerchants,
    overrideExistingCategories,
  });

  res.status(200).json(result);
});
