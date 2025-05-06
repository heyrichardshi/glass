import type { Tag, ListTagsResponse } from "@saffron/types";

export default function (userId: string) {
  const config = useRuntimeConfig();

  const cacheKey = `ListTags:${userId}`;
  const cachedFetch = useState(cacheKey, () => {
    return useFetch(`${config.public.SAFFRON_API_URL}/tags`, {
      query: { userId },
      server: false,
    });
  });

  const { data, status, error, refresh, clear } = cachedFetch.value;

  const tags = computed<Tag[]>(
    () => (data.value as ListTagsResponse)?.tags || [],
  );

  return { tags, status, error, refresh };
}
