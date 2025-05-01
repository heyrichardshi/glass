import { Router } from "express";
import * as reports from "../controllers/reports";

const router = Router();

router.get("/reports/monthly", reports.getMonthlyReport);

export default router;
