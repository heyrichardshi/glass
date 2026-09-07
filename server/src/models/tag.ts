export interface Tag {
  id: string;
  name: string;
  /** Currently always DEFAULT_TAXONOMY_USER_ID; the taxonomy is not user-scoped yet. */
  userId: string;

  // TODO: Add `usageCount: number` to track tag usage.
}
