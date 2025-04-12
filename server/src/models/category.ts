export interface Category {
  id: string;
  name: string;

  /** The ID of the parent category, if the current one is nested. */
  parentId: string;

  /**
   * The full path of the category, starting from the root category.
   *
   * @example ['Food', 'Restaurants', 'Fast Food']
   */
  fullPath: string[];
}
