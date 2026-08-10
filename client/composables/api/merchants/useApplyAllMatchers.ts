import type { ApplyAllMatchersResponse } from "@glass/types/schemas";

export default function (request: {
  householdId: string;
  overrideExistingMerchants: boolean;
  overrideExistingCategories: boolean;
}) {
  const config = useRuntimeConfig();

  const errorMessage = ref<string | undefined>(undefined);
  const { data, status, error } = useFetch(
    () => `${config.public.GLASS_API_URL}/merchants/matchers/all`,
    {
      method: "POST",
      body: request,
      server: false,
      onResponseError: (e) => {
        console.error("Error applying all matchers:", e);
        errorMessage.value =
          e.response?._data?.message || "An unknown error occurred";
      },
    },
  );

  const retaggedCount = computed(
    () => (data.value as ApplyAllMatchersResponse)?.retaggedCount,
  );

  return { retaggedCount, status, errorMessage, error };
}
