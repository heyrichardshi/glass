import type { Category, CreateCategoryResponse } from "@glass/types";

export default function (name: string, parentId?: string) {
  const { apiBase } = useApiBase();

  const errorMessage = ref<string | undefined>(undefined);
  const { data, status, error, refresh, clear } = useFetch(
    () => `${apiBase.value}/categories`,
    {
      method: "POST",
      body: { name, parentId },
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
