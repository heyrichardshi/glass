import { requireUserId } from "../middleware/requireToken";
import * as merchants from "../services/merchant.service";
import asyncController, { NoBody, NoParams, NoQuery } from "./asyncController";
import {
  ApplyAllMatchersBody,
  ApplyAllMatchersResponse,
  CreateMerchantBody,
  CreateMerchantResponse,
  ListMerchantsResponse,
  UpdateMerchantBody,
  UpdateMerchantResponse,
} from "@glass/types/schemas";

export const listMerchants = asyncController<
  NoParams,
  NoQuery,
  NoBody,
  ListMerchantsResponse
>(async (_req, res) => {
  const merchantsList = await merchants.listMerchants();
  res.status(200).json(merchantsList);
});

export const createMerchant = asyncController<
  NoParams,
  NoQuery,
  CreateMerchantBody,
  CreateMerchantResponse
>(async (req, res) => {
  const { name, defaultCategoryId, descriptionMatchers } = req.body;

  const merchant = await merchants.createMerchant({
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
  const { name, defaultCategoryId, descriptionMatchers } = req.body;
  const merchantId = req.params.merchantId;

  const merchant = await merchants.updateMerchant(merchantId, {
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
  const { overrideExistingMerchants, overrideExistingCategories } = req.body;

  const result = await merchants.applyAllMatchers({
    userId: requireUserId(req),
    overrideExistingMerchants,
    overrideExistingCategories,
  });

  res.status(200).json(result);
});
