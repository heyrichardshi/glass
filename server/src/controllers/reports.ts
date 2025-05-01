import * as analytics from "../services/analytics";
import asyncController from "./asyncController";
import { InvalidInputError } from "../common/errors";

export const getMonthlyReport = asyncController(async (req, res) => {
  const userId = req.query.userId as string | undefined;
  const year = req.query.year as string | undefined;
  const month = req.query.month as string | undefined;

  if (!userId) {
    throw new InvalidInputError("userId");
  }
  if (!year) {
    throw new InvalidInputError("year");
  }
  if (!month) {
    throw new InvalidInputError("month");
  }

  const response = await analytics.getMonthlyReport({ userId, year, month });

  res.status(200).json(response);
});
