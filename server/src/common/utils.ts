export function formatDate(date: Date): string {
  return date.toISOString().substring(0, 10);
}

/**
 * Transforms an array of entities into a record (object) indexed by the `id` property of each entity.
 */
export function indexById<T extends { id: string }, U>(
  items: T[],
  transformer: (input: T) => U,
): Record<string, U> {
  return items.reduce(
    (acc, item) => {
      acc[item.id] = transformer(item);
      return acc;
    },
    {} as Record<string, U>,
  );
}
