import type { Merchant, ListMerchantsResponse } from "@glass/types";

export default function () {
  const { apiBase } = useApiBase();

  const { data, status, error, refresh } = useFetch(
    `${apiBase.value}/merchants`,
    {
      key: "ListMerchants",
      // Without getCachedData, useFetch re-fetches on every navigation.
      // This returns cached data from a previous fetch if available,
      // skipping the network request. Call refresh() to force a re-fetch.
      getCachedData: (key, nuxtApp) => nuxtApp.payload.data[key],
    },
  );

  const merchants = computed<Merchant[]>(
    () => (data.value as ListMerchantsResponse)?.merchants || [],
  );

  return { merchants, status, error, refresh };
}
