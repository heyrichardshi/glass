import type {
  Merchant,
  UpdateMerchantResponse,
  UpdateMerchantRequest,
} from "@glass/types";

export default function (merchantId: string, request: UpdateMerchantRequest) {
  const config = useRuntimeConfig();

  const errorMessage = ref<string | undefined>(undefined);
  const { data, status, error, refresh, clear } = useFetch(
    () => `${config.public.GLASS_API_URL}/merchants/${merchantId}`,
    {
      method: "PUT",
      body: request,
      server: false,
      onResponseError: (e) => {
        console.error("Error updating merchant:", e);
        console.error(
          "Error updating merchant message:",
          e.response?._data?.message,
        );
        errorMessage.value =
          e.response?._data?.message || "An unknown error occurred";
      },
    },
  );

  const merchant = computed<Merchant | undefined>(
    () => (data.value as UpdateMerchantResponse)?.merchant,
  );

  return { merchant, status, errorMessage, error, refresh };
}
