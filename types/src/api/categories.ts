import { Category } from "../models/category";

export interface ListCategoriesRequest {
  householdId: string;
}

export interface ListCategoriesResponse {
  categories: Category[];
}

export interface CreateCategoryRequest {
  householdId: string;
  name: string;
  parentId?: string;
}

export interface CreateCategoryResponse {
  category: Category;
}
