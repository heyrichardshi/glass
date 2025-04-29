import * as apiTypes from "@saffron/types";
import { Category } from "./category";
import { Tag } from "./tag";

export function toApiCategory(category: Category): apiTypes.Category {
  return {
    id: category.id,
    name: category.name,
    parentId: category.parentId,
    fullPath: category.fullPath,
    isDefault: category.isDefault,
  };
}

export function toApiTag(tag: Tag): apiTypes.Tag {
  return {
    id: tag.id,
    name: tag.name,
    householdId: tag.householdId,
  };
}
