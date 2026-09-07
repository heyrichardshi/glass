import type { Account, ListAccountsResponse } from "@glass/types";

export default function () {
  const { apiBase } = useApiBase();

  const { data, status, refresh } = useFetch(`${apiBase.value}/accounts`, {
    key: "ListAccounts",
    // Without getCachedData, useFetch re-fetches on every navigation.
    // This returns cached data from a previous fetch if available,
    // skipping the network request. Call refresh() to force a re-fetch.
    getCachedData: (key, nuxtApp) => nuxtApp.payload.data[key],
  });

  const accounts = computed<Account[]>(
    () => (data.value as ListAccountsResponse)?.accounts || [],
  );

  return { accounts, status, refresh };
}
