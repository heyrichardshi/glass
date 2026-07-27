import { Router } from "express";
import * as accounts from "../controllers/account.controller";
import {
  validateQuery,
  validateRequest,
  validateResponse,
} from "../middleware/validation";
import {
  ConnectionTokenResponseSchema,
  ListAccountsQuerySchema,
  ListAccountsResponseSchema,
  RegisterAccountsBodySchema,
  RegisterAccountsResponseSchema,
} from "@saffron/types/schemas";

const router = Router();

router.post(
  "/accounts/register/token",
  validateResponse(ConnectionTokenResponseSchema),
  accounts.getConnectionToken,
);

router.post(
  "/accounts/register",
  validateRequest(RegisterAccountsBodySchema),
  validateResponse(RegisterAccountsResponseSchema),
  accounts.registerAccounts,
);

router.get(
  "/accounts",
  validateQuery(ListAccountsQuerySchema),
  validateResponse(ListAccountsResponseSchema),
  accounts.listAccountsForUser,
);
router.post("/accounts/:accountId/refresh", accounts.refreshAccount);

export default router;
