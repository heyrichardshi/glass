import type {
  Merchant,
  ListMerchantsResponse,
  ListMerchantsRequest,
} from "@saffron/types";

export default function (request: ListMerchantsRequest) {
  const config = useRuntimeConfig();

  const key = `ListMerchants:${request.householdId}`;
  const { data, status, error, refresh } = useFetch(
    `${config.public.SAFFRON_API_URL}/merchants`,
    {
      key,
      query: request,
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
