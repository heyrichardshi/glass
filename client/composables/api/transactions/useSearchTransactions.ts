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

  const cacheKey = `SearchTransactions:${JSON.stringify(params.filters)}:${params.paginationToken || ""}`;
  const cachedFetch = useState(cacheKey, () => {
    return useFetch<ListTransactionsResponse>(
      `${config.public.SAFFRON_API_URL}/transactions/search`,
      {
        method: "POST",
        body: {
          filters: params.filters,
          ...(params.paginationToken
            ? { paginationToken: params.paginationToken }
            : {}),
        },
        server: false,
      },
    );
  });

  const { data, status, error, refresh, clear } = cachedFetch.value;

  const transactions = computed(() => data.value?.transactions || []);
  const paginationToken = computed(() => data.value?.paginationToken);

  return { data, transactions, paginationToken, status, error, refresh };
}
