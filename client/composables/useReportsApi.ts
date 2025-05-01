import type { GetMonthlyReportRequest } from "@saffron/types";
import useGetMonthlyReport from "./api/reports/useGetMonthlyReport";

export default function () {
  const getMonthlyReport = (request: GetMonthlyReportRequest) =>
    useGetMonthlyReport(request);

  return { getMonthlyReport };
}
