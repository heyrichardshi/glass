import type {
  Merchant,
  ListMerchantsResponse,
  ListMerchantsRequest,
} from "@saffron/types";

export default function (request: ListMerchantsRequest) {
  const config = useRuntimeConfig();

  const cacheKey = `ListMerchants:${request.householdId}`;
  const cachedFetch = useState(cacheKey, () => {
    return useFetch(`${config.public.SAFFRON_API_URL}/merchants`, {
      query: request,
      server: false,
    });
  });

  const { data, status, error, refresh, clear } = cachedFetch.value;

  const merchants = computed<Merchant[]>(
    () => (data.value as ListMerchantsResponse)?.merchants || [],
  );

  return { merchants, status, error, refresh };
}
