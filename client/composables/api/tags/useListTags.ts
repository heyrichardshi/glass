import type { Tag, ListTagsResponse } from "@saffron/types";

export default function (userId: string) {
  const config = useRuntimeConfig();

  const { data, status, error, refresh, clear } = useFetch(
    () => `${config.public.SAFFRON_API_URL}/tags`,
    {
      query: { userId },
      server: false,
    },
  );

  const tags = computed<Tag[]>(
    () => (data.value as ListTagsResponse)?.tags || [],
  );

  return { tags, status, error, refresh };
}
