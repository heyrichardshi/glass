import { Router } from "express";
import * as reports from "../controllers/report.controller";
import { validateQuery, validateResponse } from "../middleware/validation";
import {
  GetMonthlyReportQuerySchema,
  GetMonthlyReportResponseSchema,
} from "@glass/types/schemas";

const router = Router();

router.get(
  "/reports/monthly",
  validateQuery(GetMonthlyReportQuerySchema),
  validateResponse(GetMonthlyReportResponseSchema),
  reports.getMonthlyReport,
);

export default router;
