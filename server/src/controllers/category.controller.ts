import * as categories from "../services/category.service";
import asyncController, { NoBody, NoParams, NoQuery } from "./asyncController";
import {
  CreateCategoryBody,
  CreateCategoryResponse,
  ListCategoriesResponse,
} from "@glass/types/schemas";

export const listCategories = asyncController<
  NoParams,
  NoQuery,
  NoBody,
  ListCategoriesResponse
>(async (_req, res) => {
  const categoriesList = await categories.listCategories();
  res.status(200).json(categoriesList);
});

export const createCategory = asyncController<
  NoParams,
  NoQuery,
  CreateCategoryBody,
  CreateCategoryResponse
>(async (req, res) => {
  const { name, parentId } = req.body;

  const category = await categories.createCategory({ name, parentId });
  res.status(201).json(category);
});
