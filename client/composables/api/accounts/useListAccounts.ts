import type { Account, ListAccountsResponse } from "@glass/types";

export default function (userId: string) {
  const config = useRuntimeConfig();

  const { data, status, refresh } = useFetch(
    `${config.public.GLASS_API_URL}/accounts`,
    {
      key: `ListAccounts:${userId}`,
      query: { userId },
      // Without getCachedData, useFetch re-fetches on every navigation.
      // This returns cached data from a previous fetch if available,
      // skipping the network request. Call refresh() to force a re-fetch.
      getCachedData: (key, nuxtApp) => nuxtApp.payload.data[key],
    },
  );

  const accounts = computed<Account[]>(
    () => (data.value as ListAccountsResponse)?.accounts || [],
  );

  return { accounts, status, refresh };
}
