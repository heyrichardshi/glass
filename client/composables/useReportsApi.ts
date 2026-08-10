import type { GetMonthlyReportRequest } from "@glass/types";
import useGetMonthlyReport from "./api/reports/useGetMonthlyReport";

export default function () {
  const getMonthlyReport = (request: GetMonthlyReportRequest) =>
    useGetMonthlyReport(request);

  return { getMonthlyReport };
}
