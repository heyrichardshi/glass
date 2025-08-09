import { z } from 'zod';
import { TransactionSchema, TransactionCounterpartySchema } from '../../models';

export const BulkUpdateTransactionsBodySchema = z.object({
  userId: z.string(),
  transactionIds: z.array(z.string()),
  updates: z.object({
    categoryId: z.string().optional(),
    tagIds: z.array(z.string()).optional(),
    counterparty: TransactionCounterpartySchema.optional(),
  }),
});
export type BulkUpdateTransactionsBody = z.infer<typeof BulkUpdateTransactionsBodySchema>;

export const BulkUpdateTransactionsResponseSchema = z.object({
  updatedTransactions: z.array(TransactionSchema),
  failedUpdates: z.array(z.object({
    transactionId: z.string(),
    error: z.string(),
  })),
});
export type BulkUpdateTransactionsResponse = z.infer<typeof BulkUpdateTransactionsResponseSchema>; 