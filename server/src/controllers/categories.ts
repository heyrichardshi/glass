import * as categories from "../services/categories";
import asyncController, { NoBody, NoParams, NoQuery } from "./asyncController";
import {
  CreateCategoryBody,
  CreateCategoryResponse,
  ListCategoriesQuery,
  ListCategoriesResponse,
} from "@saffron/types/schemas";

export const listCategories = asyncController<
  NoParams,
  ListCategoriesQuery,
  NoBody,
  ListCategoriesResponse
>(async (req, res) => {
  const { userId } = req.query;

  const categoriesList = await categories.listCategories({
    householdId: userId,
  });
  res.status(200).json(categoriesList);
});

export const createCategory = asyncController<
  NoParams,
  NoQuery,
  CreateCategoryBody,
  CreateCategoryResponse
>(async (req, res) => {
  const { userId, name, parentId } = req.body;

  const category = await categories.createCategory({
    householdId: userId,
    name,
    parentId,
  });
  res.status(201).json(category);
});
