import * as analytics from "../services/analytics";
import asyncController, { NoBody, NoParams, NoQuery } from "./asyncController";
import {
  GetMonthlyReportQuery,
  GetMonthlyReportResponse,
} from "@saffron/types/schemas";

export const getMonthlyReport = asyncController<
  NoParams,
  GetMonthlyReportQuery,
  NoBody,
  GetMonthlyReportResponse
>(async (req, res) => {
  const { userId, year, month } = req.query;

  const response = await analytics.getMonthlyReport({ userId, year, month });

  res.status(200).json(response);
});
