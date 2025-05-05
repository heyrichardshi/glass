import * as categories from "../services/categories";
import asyncController from "./asyncController";
import { InvalidInputError } from "../common/errors";

export const listCategories = asyncController(async (req, res) => {
  const userId = req.query.userId as string | undefined;
  if (!userId) {
    throw new InvalidInputError("userId");
  }

  const categoriesList = await categories.listCategories({
    householdId: userId,
  });
  res.status(200).json(categoriesList);
});

export const createCategory = asyncController(async (req, res) => {
  const userId = req.query.userId as string | undefined; // ?userId=...
  const name = req.query.name as string | undefined; // ?name=...
  const parentId = req.query.parentId as string | undefined; // ?parentId=...

  if (!userId) {
    throw new InvalidInputError("userId");
  }

  if (!name) {
    throw new InvalidInputError("name");
  }

  const category = await categories.createCategory({
    householdId: userId,
    name,
    parentId,
  });
  res.status(200).json(category);
});
