import { Router } from "express";
import * as reports from "../controllers/reports";
import { validateQuery, validateResponse } from "../middleware/validation";
import {
  GetMonthlyReportQuerySchema,
  GetMonthlyReportResponseSchema,
} from "@saffron/types/schemas";

const router = Router();

router.get(
  "/reports/monthly",
  validateQuery(GetMonthlyReportQuerySchema),
  validateResponse(GetMonthlyReportResponseSchema),
  reports.getMonthlyReport,
);

export default router;
