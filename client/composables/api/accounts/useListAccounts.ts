import type { Account, ListAccountsResponse } from "@saffron/types";

export default function (userId: string) {
  const config = useRuntimeConfig();

  const cacheKey = `ListAccounts:${userId}`;
  const cachedFetch = useState(cacheKey, () => {
    return useFetch(`${config.public.SAFFRON_API_URL}/accounts`, {
      query: { userId },
      server: false,
    });
  });

  const { data, status, error, refresh, clear } = cachedFetch.value;

  const accounts = computed<Account[]>(
    () => (data.value as ListAccountsResponse)?.accounts || [],
  );

  return { accounts, status, refresh };
}
