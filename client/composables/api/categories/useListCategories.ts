import type { Category, ListCategoriesResponse } from "@saffron/types";

export default function (userId: string) {
  const config = useRuntimeConfig();

  const cacheKey = `ListCategories:${userId}`;
  const cachedFetch = useState(cacheKey, () => {
    return useFetch(`${config.public.SAFFRON_API_URL}/categories`, {
      query: { userId },
      server: false,
    });
  });

  const { data, status, error, refresh, clear } = cachedFetch.value;

  const categories = computed<Category[]>(
    () => (data.value as ListCategoriesResponse)?.categories || [],
  );

  return { categories, status, refresh };
}
