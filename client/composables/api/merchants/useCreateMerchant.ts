import type {
  Merchant,
  CreateMerchantResponse,
  CreateMerchantRequest,
} from "@glass/types";

export default function (request: CreateMerchantRequest) {
  const { apiBase } = useApiBase();

  const errorMessage = ref<string | undefined>(undefined);
  const { data, status, error, refresh, clear } = useFetch(
    () => `${apiBase.value}/merchants`,
    {
      method: "POST",
      body: request,
      server: false,
      onResponseError: (e) => {
        console.error("Error creating merchant:", e);
        console.error(
          "Error creating merchant message:",
          e.response?._data?.message,
        );
        errorMessage.value =
          e.response?._data?.message || "An unknown error occurred";
      },
    },
  );

  const merchant = computed<Merchant | undefined>(
    () => (data.value as CreateMerchantResponse)?.merchant,
  );

  return { merchant, status, errorMessage, error, refresh };
}
