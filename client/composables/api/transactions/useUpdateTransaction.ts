import type {
  Transaction,
  UpdateTransactionRequest,
  UpdateTransactionResponse,
} from "@glass/types";

export default function (request: UpdateTransactionRequest) {
  const config = useRuntimeConfig();

  const errorMessage = ref<string | undefined>(undefined);
  const { data, status, error, refresh, clear } = useFetch(
    () =>
      `${config.public.GLASS_API_URL}/transactions/${request.transactionId}`,
    {
      method: "PUT",
      body: request,
      server: false,
      onResponseError: (e) => {
        console.error("Error updating transaction:", e);
        errorMessage.value =
          e.response?._data?.message || "An unknown error occurred";
      },
    },
  );

  const transaction = computed<Transaction | undefined>(
    () => (data.value as UpdateTransactionResponse)?.transaction,
  );

  return { transaction, status, errorMessage, error, refresh };
}
