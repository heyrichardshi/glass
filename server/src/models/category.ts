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

const INCOME_CATEGORY_NAME = "Income";
/**
 * These are categories that are not considered expenses and are included in the default categories.
 */
const NON_EXPENSE_CATEGORIES = [INCOME_CATEGORY_NAME, "Transfer"];

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

export const UNCATEGORIZED_CATEGORY_ID = "0";
const UNCATEGORIZED_CATEGORY: Category = {
  id: UNCATEGORIZED_CATEGORY_ID,
  name: "Uncategorized",
  fullPath: ["Uncategorized"],
  isDefault: true,
  householdId: "", // This will be set when returned as part of the default categories.
};

export function getDefaultCategories(householdId: string): Category[] {
  const defaultCategories: Category[] = DEFAULT_CATEGORIES.map((category) => ({
    id: `default_${category}`,
    name: category,
    fullPath: [category],
    isDefault: true,
    householdId,
  }));

  // Add 'Uncategorized' to the list of default categories since it has a special fixed ID.
  defaultCategories.push({
    ...UNCATEGORIZED_CATEGORY,
    householdId,
  });

  return defaultCategories;
}

export function isIncomeCategory(category: Category): boolean {
  const topLevelCategory = category.fullPath[0];
  return topLevelCategory === INCOME_CATEGORY_NAME;
}

export function isExpenseCategory(category: Category): boolean {
  const topLevelCategory = category.fullPath[0];
  return !NON_EXPENSE_CATEGORIES.includes(topLevelCategory);
}
