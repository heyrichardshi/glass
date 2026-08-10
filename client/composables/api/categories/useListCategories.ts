import type { Category, ListCategoriesResponse } from "@glass/types";

export default function (userId: string) {
  const { apiBase } = useApiBase();

  const key = `ListCategories:${userId}`;
  const { data, status, refresh } = useFetch(
    `${apiBase.value}/categories`,
    {
      key,
      query: { userId },
      // Without getCachedData, useFetch re-fetches on every navigation.
      // This returns cached data from a previous fetch if available,
      // skipping the network request. Call refresh() to force a re-fetch.
      getCachedData: (key, nuxtApp) => nuxtApp.payload.data[key],
    },
  );

  const categories = computed<Category[]>(
    () => (data.value as ListCategoriesResponse)?.categories || [],
  );

  return { categories, status, refresh };
}
