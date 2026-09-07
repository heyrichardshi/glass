import { Category } from "../models/category";

export interface ListCategoriesResponse {
  categories: Category[];
}

export interface CreateCategoryRequest {
  name: string;
  parentId?: string;
}

export interface CreateCategoryResponse {
  category: Category;
}
