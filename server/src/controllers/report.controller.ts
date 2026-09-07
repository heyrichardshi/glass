import { requireUserId } from "../middleware/requireToken";
import * as analytics from "../services/analytics.service";
import asyncController, { NoBody, NoParams, NoQuery } from "./asyncController";
import {
  GetMonthlyReportQuery,
  GetMonthlyReportResponse,
} from "@glass/types/schemas";

export const getMonthlyReport = asyncController<
  NoParams,
  GetMonthlyReportQuery,
  NoBody,
  GetMonthlyReportResponse
>(async (req, res) => {
  const { year, month } = req.query;

  const response = await analytics.getMonthlyReport(requireUserId(req), {
    year,
    month,
  });

  res.status(200).json(response);
});
