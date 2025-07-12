import type { Tag, CreateTagResponse } from "@saffron/types";

export default function (userId: string, name: string, parentId?: string) {
  const config = useRuntimeConfig();

  const errorMessage = ref<string | undefined>(undefined);
  const { data, status, error, refresh, clear } = useFetch(
    () => `${config.public.SAFFRON_API_URL}/tags`,
    {
      method: "POST",
      body: { userId, name, parentId },
      server: false,
      onResponseError: (e) => {
        console.error("Error creating tag:", e);
        console.error(
          "Error creating tag message:",
          e.response?._data?.message,
        );
        errorMessage.value =
          e.response?._data?.message || "An unknown error occurred";
      },
    },
  );

  const tag = computed<Tag | undefined>(
    () => (data.value as CreateTagResponse)?.tag,
  );

  return { tag, status, errorMessage, error, refresh };
}
