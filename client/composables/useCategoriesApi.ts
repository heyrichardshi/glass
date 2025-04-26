import type { Category, ListCategoriesResponse } from "@saffron/types";

export default function (userId: string) {
  const config = useRuntimeConfig();

  const { data, status, error, refresh, clear } = useFetch(
    () => `${config.public.SAFFRON_API_URL}/categories`,
    {
      query: { userId },
      server: false,
    },
  );

  const categories = computed<Category[]>(
    () => (data.value as ListCategoriesResponse)?.categories || [],
  );

  return { categories, status, error, refresh };
}
