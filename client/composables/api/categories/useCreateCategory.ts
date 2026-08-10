import type { Category, CreateCategoryResponse } from "@glass/types";

export default function (userId: string, name: string, parentId?: string) {
  const config = useRuntimeConfig();

  const errorMessage = ref<string | undefined>(undefined);
  const { data, status, error, refresh, clear } = useFetch(
    () => `${config.public.GLASS_API_URL}/categories`,
    {
      method: "POST",
      body: { userId, name, parentId },
      server: false,
      onResponseError: (e) => {
        console.error("Error creating category:", e);
        console.error(
          "Error creating category message:",
          e.response?._data?.message,
        );
        errorMessage.value =
          e.response?._data?.message || "An unknown error occurred";
      },
    },
  );

  const category = computed<Category | undefined>(
    () => (data.value as CreateCategoryResponse)?.category,
  );

  return { category, status, errorMessage, error, refresh };
}
