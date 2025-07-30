import type {
  BulkUpdateTransactionsRequest,
  BulkUpdateTransactionsResponse,
} from "@saffron/types";

export default function (request: BulkUpdateTransactionsRequest) {
  const config = useRuntimeConfig();

  const errorMessage = ref<string | undefined>(undefined);
  const { data, status, error, refresh, clear } = useFetch(
    () => `${config.public.SAFFRON_API_URL}/transactions/bulk`,
    {
      method: "PUT",
      body: request,
      server: false,
      onResponseError: (e) => {
        console.error("Error bulk updating transactions:", e);
        errorMessage.value =
          e.response?._data?.message || "An unknown error occurred";
      },
    },
  );

  const response = computed<BulkUpdateTransactionsResponse | undefined>(
    () => data.value as BulkUpdateTransactionsResponse,
  );

  return { response, status, errorMessage, error, refresh };
}
