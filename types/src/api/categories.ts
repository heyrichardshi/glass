import { Category } from "../models/category";

export interface ListCategoriesRequest {
  householdId: string;
}

export interface ListCategoriesResponse {
  categories: Category[];
}
