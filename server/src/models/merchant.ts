/**
 * Represents a merchant that a user has made a transaction with.
 */
export interface Merchant {
  id: string;
  name: string;
  /** Currently always DEFAULT_TAXONOMY_USER_ID; the taxonomy is not user-scoped yet. */
  userId: string;
  defaultCategoryId: string;

  /** A list of regex patterns to match against lowercased transaction descriptions for automatic merchant assignment. */
  descriptionMatchers: string[];
}
