import type { UpdateTransactionRequest } from "@saffron/types";

export default function (request: UpdateTransactionRequest) {
  const config = useRuntimeConfig();

  const errorMessage = ref<string | undefined>(undefined);
  const { data, status, error, refresh, clear } = useFetch(
    () =>
      `${config.public.SAFFRON_API_URL}/transactions/${request.transactionId}`,
    {
      method: "POST",
      query: request,
      server: false,
      onResponseError: (e) => {
        console.error("Error updating transaction:", e);
        errorMessage.value =
          e.response?._data?.message || "An unknown error occurred";
      },
    },
  );

  return { data, status, errorMessage, error, refresh };
}
