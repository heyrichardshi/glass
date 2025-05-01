export interface Category {
  id: string;
  name: string;

  /** The ID of the parent category, if the current one is nested. */
  parentId?: string;

  /**
   * The full path of the category, starting from the root category.
   *
   * @example ['Food', 'Restaurants', 'Fast Food']
   */
  fullPath: string[];

  /**
   * Indicates whether this category is a default category. Default categories are immutable.
   */
  isDefault?: boolean;

  /**
   * The household to which this category belongs. Categories are unique per household.
   */
  householdId: string;
}

export function toApiModel(category: Category): Category {
  return {
    id: category.id,
    name: category.name,
    parentId: category.parentId,
    fullPath: category.fullPath,
    isDefault: category.isDefault,
    householdId: category.householdId,
  };
}

/**
 * These are categories that are not considered expenses and are included in the default categories.
 */
const NON_EXPENSE_CATEGORIES = ["Income", "Transfer"];

/**
 * These are immutable categories that are created by default when a user is created.
 */
const DEFAULT_CATEGORIES = [
  ...NON_EXPENSE_CATEGORIES,
  "Food",
  "Home",
  "Health",
  "Auto",
  "Shopping",
  "Entertainment",
  "Travel",
];

export function getDefaultCategories(householdId: string): Category[] {
  return DEFAULT_CATEGORIES.map((category) => ({
    id: `default_${category}`,
    name: category,
    fullPath: [category],
    isDefault: true,
    householdId,
  }));
}
