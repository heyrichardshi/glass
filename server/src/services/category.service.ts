import {
  CreateCategoryRequest,
  CreateCategoryResponse,
  ListCategoriesRequest,
  ListCategoriesResponse,
} from "@glass/types";
import { CategoryRepository } from "../repositories";
import { Category, toApiCategory } from "../models";
import { ConflictError, NotFoundError } from "../common/errors";
import { randomUUID } from "crypto";

export async function listCategories(
  request: ListCategoriesRequest,
): Promise<ListCategoriesResponse> {
  const categoryRepository = await CategoryRepository.getInstance();
  const categories = await categoryRepository.listAll(request.householdId);
  return {
    categories: categories.map((category) => toApiCategory(category)),
  };
}

export async function createCategory(
  request: CreateCategoryRequest,
): Promise<CreateCategoryResponse> {
  const { householdId, name, parentId } = request;
  console.log(
    `createCategory() called with householdId: ${householdId}, name: ${name}, parentId: ${parentId}`,
  );

  const categoryRepository = await CategoryRepository.getInstance();

  // Get the parent category if it exists
  let parent: Category | undefined;
  if (parentId) {
    parent = await categoryRepository.findById(parentId, householdId);

    // No category found with id = parentId, so we cannot create a nested category under it.
    if (!parent) {
      console.log(`No category found with id: ${parentId}`);
      throw new NotFoundError(
        `Category with given id '${parentId}' does not exist.`,
      );
    }
    console.log(`Parent category found: `, parent);
  }

  // Check if category with given path already exists
  const siblings = await categoryRepository.listAllDirectChildren(
    householdId,
    parentId,
  );
  const existing = siblings.find((category) => category.name === name);
  if (existing) {
    throw new ConflictError("Category", name);
  }
  console.log(`No existing category found with name: ${name}`);

  // Create the new category
  const newCategory = await categoryRepository.upsert({
    id: randomUUID(),
    name: name,
    parentId: parentId,
    fullPath: [...(parent?.fullPath || []), name],
    householdId: householdId,
  });

  return {
    category: toApiCategory(newCategory),
  };
}
