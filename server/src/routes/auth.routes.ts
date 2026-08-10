import { Router } from "express";
import * as auth from "../controllers/auth.controller";
import { validateRequest, validateResponse } from "../middleware/validation";
import {
  ExchangeTokenBodySchema,
  ExchangeTokenResponseSchema,
} from "@glass/types/schemas";

const router = Router();

router.post(
  "/auth/token",
  validateRequest(ExchangeTokenBodySchema),
  validateResponse(ExchangeTokenResponseSchema),
  auth.exchangeToken,
);

export default router;
