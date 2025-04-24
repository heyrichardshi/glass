import * as apiTypes from "@saffron/types";
import { Category } from "./category";

export function toApiCategory(category: Category): apiTypes.Category {
  return {
    id: category.id,
    name: category.name,
    parentId: category.parentId,
    fullPath: category.fullPath,
    isDefault: category.isDefault,
  };
}
