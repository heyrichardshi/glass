import { Router } from "express";
import * as transactions from "../controllers/transactions";
import {
  validateQuery,
  validateRequest,
  validateParams,
  validateResponse,
} from "../middleware/validation";
import {
  ListTransactionsQuerySchema,
  BulkUpdateTransactionsBodySchema,
  UpdateTransactionParamsSchema,
  UpdateTransactionBodySchema,
  ListTransactionsResponseSchema,
  BulkUpdateTransactionsResponseSchema,
  UpdateTransactionResponseSchema,
} from "@saffron/types/schemas";

const router = Router();

router.get(
  "/transactions",
  validateQuery(ListTransactionsQuerySchema),
  validateResponse(ListTransactionsResponseSchema),
  transactions.listByUser,
);

router.put(
  "/transactions/bulk",
  validateRequest(BulkUpdateTransactionsBodySchema),
  validateResponse(BulkUpdateTransactionsResponseSchema),
  transactions.bulkUpdateTransactions,
);

router.put(
  "/transactions/:transactionId",
  validateParams(UpdateTransactionParamsSchema),
  validateRequest(UpdateTransactionBodySchema),
  validateResponse(UpdateTransactionResponseSchema),
  transactions.updateTransaction,
);

export default router;
