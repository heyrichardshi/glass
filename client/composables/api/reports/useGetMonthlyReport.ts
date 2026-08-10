import type {
  GetMonthlyReportRequest,
  GetMonthlyReportResponse,
} from "@glass/types";

export default function (request: GetMonthlyReportRequest) {
  const { apiBase } = useApiBase();

  const errorMessage = ref<string | undefined>(undefined);
  const { data, status, error, refresh, clear } = useFetch(
    () => `${apiBase.value}/reports/monthly`,
    {
      query: request,
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

  const response = computed<GetMonthlyReportResponse>(
    () => data.value as GetMonthlyReportResponse,
  );

  return { response, status, errorMessage, error, refresh };
}
