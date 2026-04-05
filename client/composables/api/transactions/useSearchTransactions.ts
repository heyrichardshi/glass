import type { ListTransactionsResponse } from "@saffron/types";

type SearchFilters = {
  searchText?: string;
  accountIds?: string[];
  merchantIds?: string[];
  categoryIds?: string[];
  tagIds?: string[];
};

export default function (params: {
  filters: SearchFilters;
  paginationToken?: string;
}) {
  const config = useRuntimeConfig();

  const key = `SearchTransactions:${JSON.stringify(params.filters)}:${params.paginationToken || ""}`;
  const { data, status, error, refresh } = useFetch<ListTransactionsResponse>(
    `${config.public.SAFFRON_API_URL}/transactions/search`,
    {
      key,
      method: "POST",
      body: {
        filters: params.filters,
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
