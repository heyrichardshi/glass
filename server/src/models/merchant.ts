/**
 * Represents a merchant that a user has made a transaction with.
 */
export interface Merchant {
  id: string;
  name: string;
  normalizedNames: string[];
  defaultCategoryId: string;
}
