import type { Tag, ListTagsResponse } from "@glass/types";

export default function (userId: string) {
  const { apiBase } = useApiBase();

  const key = `ListTags:${userId}`;
  const { data, status, error, refresh } = useFetch(
    `${apiBase.value}/tags`,
    {
      key,
      query: { userId },
      // Without getCachedData, useFetch re-fetches on every navigation.
      // This returns cached data from a previous fetch if available,
      // skipping the network request. Call refresh() to force a re-fetch.
      getCachedData: (key, nuxtApp) => nuxtApp.payload.data[key],
    },
  );

  const tags = computed<Tag[]>(
    () => (data.value as ListTagsResponse)?.tags || [],
  );

  return { tags, status, error, refresh };
}
