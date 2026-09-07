import type { ListTransactionsResponse } from "@glass/types";

export default function (params: { paginationToken?: string } = {}) {
  const { apiBase } = useApiBase();

  const key = `ListTransactions:${params.paginationToken || ""}`;
  const { data, status, error, refresh } = useFetch<ListTransactionsResponse>(
    `${apiBase.value}/transactions`,
    {
      key,
      query: {
        ...(params.paginationToken
          ? { paginationToken: params.paginationToken }
          : {}),
      },
      // Without getCachedData, useFetch re-fetches on every navigation.
      // This returns cached data from a previous fetch if available,
      // skipping the network request. Call refresh() to force a re-fetch.
      getCachedData: (key, nuxtApp) => nuxtApp.payload.data[key],
    },
  );

  const transactions = computed(() => data.value?.transactions || []);
  const paginationToken = computed(() => data.value?.paginationToken);

  return { data, transactions, paginationToken, status, error, refresh };
}
