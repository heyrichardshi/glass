import type { ListTransactionsResponse } from "@saffron/types";

export default function (params: { userId: string; paginationToken?: string }) {
  const config = useRuntimeConfig();

  const cacheKey = `ListTransactions:${params.userId}:${params.paginationToken || ""}`;
  const cachedFetch = useState(cacheKey, () => {
    return useFetch<ListTransactionsResponse>(
      `${config.public.SAFFRON_API_URL}/transactions`,
      {
        query: {
          userId: params.userId,
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
