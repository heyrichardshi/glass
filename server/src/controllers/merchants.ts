import * as merchants from "../services/merchants";
import asyncController from "./asyncController";
import { InvalidInputError } from "../common/errors";

export const listMerchants = asyncController(async (req, res) => {
  const householdId = req.query.householdId as string | undefined;
  if (!householdId) {
    throw new InvalidInputError("householdId");
  }

  const merchantsList = await merchants.listMerchants({
    householdId: householdId,
  });
  res.status(200).json(merchantsList);
});

export const createMerchant = asyncController(async (req, res) => {
  const { householdId, name, defaultCategoryId, descriptionMatchers } =
    req.body;

  if (!householdId) {
    throw new InvalidInputError("householdId");
  }

  if (!name) {
    throw new InvalidInputError("name");
  }

  if (!defaultCategoryId) {
    throw new InvalidInputError("defaultCategoryId");
  }

  const merchant = await merchants.createMerchant({
    householdId,
    name,
    defaultCategoryId,
    descriptionMatchers: descriptionMatchers || [],
  });

  res.status(201).json(merchant);
});

export const updateMerchant = asyncController(async (req, res) => {
  const { householdId, name, defaultCategoryId, descriptionMatchers } =
    req.body;
  const merchantId = req.params.merchantId;

  if (!householdId) {
    throw new InvalidInputError("householdId");
  }

  if (!merchantId) {
    throw new InvalidInputError("merchantId");
  }

  const merchant = await merchants.updateMerchant(merchantId, {
    householdId,
    name,
    defaultCategoryId,
    descriptionMatchers,
  });

  res.status(200).json(merchant);
});
