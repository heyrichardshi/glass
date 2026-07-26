import { Router } from "express";
import * as accounts from "../controllers/account.controller";
import {
  validateQuery,
  validateRequest,
  validateResponse,
} from "../middleware/validation";
import {
  ListAccountsQuerySchema,
  ListAccountsResponseSchema,
  PlaidExchangeBodySchema,
  PlaidExchangeResponseSchema,
  PlaidLinkTokenResponseSchema,
  RegisterAccountsBodySchema,
  RegisterAccountsResponseSchema,
} from "@saffron/types/schemas";

const router = Router();

router.post(
  "/accounts/register",
  validateRequest(RegisterAccountsBodySchema),
  validateResponse(RegisterAccountsResponseSchema),
  accounts.registerAccounts,
);

router.post(
  "/plaid/link-token",
  validateResponse(PlaidLinkTokenResponseSchema),
  accounts.getPlaidLinkToken,
);

router.post(
  "/plaid/exchange",
  validateRequest(PlaidExchangeBodySchema),
  validateResponse(PlaidExchangeResponseSchema),
  accounts.exchangePlaidPublicToken,
);

router.get(
  "/accounts",
  validateQuery(ListAccountsQuerySchema),
  validateResponse(ListAccountsResponseSchema),
  accounts.listAccountsForUser,
);
router.post("/accounts/:accountId/refresh", accounts.refreshAccount);

export default router;
