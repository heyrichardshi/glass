import { Router } from "express";
import * as transactions from "../controllers/transactions";

const router = Router();

router.get("/transactions", transactions.listByUser);
router.put("/transactions/:transactionId", transactions.updateTransaction);

export default router;
