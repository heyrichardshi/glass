import { ListCategoriesRequest, ListCategoriesResponse } from "@saffron/types";
import { CategoryRepository } from "../repositories";
import { toApiCategory } from "../models";

export async function listCategories(
  request: ListCategoriesRequest,
): Promise<ListCategoriesResponse> {
  const categoryRepository = await CategoryRepository.getInstance();
  const categories = await categoryRepository.listAll(request.householdId);
  return {
    categories: categories.map((category) => toApiCategory(category)),
  };
}
