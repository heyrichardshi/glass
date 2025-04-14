import { Router } from "express";
import * as accounts from "../controllers/accounts";

const router = Router();

router.post("/accounts/register/:token", accounts.registerAccounts);

router.get("/accounts", accounts.listAccountsForUser);
router.post("/accounts/:accountId/refresh", accounts.refreshAccount);

export default router;
