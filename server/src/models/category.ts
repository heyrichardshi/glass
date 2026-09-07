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

  /** Currently always DEFAULT_TAXONOMY_USER_ID; the taxonomy is not user-scoped yet. */
  userId: string;
}

const INCOME_CATEGORY_NAME = "Income";
const NON_EXPENSE_CATEGORIES = [INCOME_CATEGORY_NAME, "Transfer"];

/**
 * These are immutable categories that are created by default.
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

/** A default category before it is stored; the repository supplies the partition it lands in. */
export type DefaultCategory = Omit<Category, "userId">;

export const UNCATEGORIZED_CATEGORY_ID = "0";
const UNCATEGORIZED_CATEGORY: DefaultCategory = {
  id: UNCATEGORIZED_CATEGORY_ID,
  name: "Uncategorized",
  fullPath: ["Uncategorized"],
  isDefault: true,
};

export function getDefaultCategories(): DefaultCategory[] {
  return [
    ...DEFAULT_CATEGORIES.map((category) => ({
      id: `default_${category}`,
      name: category,
      fullPath: [category],
      isDefault: true,
    })),
    // 'Uncategorized' is listed separately since it has a special fixed ID.
    UNCATEGORIZED_CATEGORY,
  ];
}

export function isIncomeCategory(category: Category): boolean {
  const topLevelCategory = category.fullPath[0];
  return topLevelCategory === INCOME_CATEGORY_NAME;
}

export function isExpenseCategory(category: Category): boolean {
  const topLevelCategory = category.fullPath[0];
  return !NON_EXPENSE_CATEGORIES.includes(topLevelCategory);
}
