import { z } from "zod";
import { TransactionSchema, TransactionCounterpartySchema } from "../../models";

export const UpdateTransactionParamsSchema = z.object({
  transactionId: z.string(),
});
export type UpdateTransactionParams = z.infer<
  typeof UpdateTransactionParamsSchema
>;

export const UpdateTransactionBodySchema = z.object({
  date: z.string().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
  categoryId: z.string().optional(),
  tagIds: z.array(z.string()).optional(),
  counterparty: TransactionCounterpartySchema.optional(),
});
export type UpdateTransactionBody = z.infer<typeof UpdateTransactionBodySchema>;

export const UpdateTransactionResponseSchema = z.object({
  transaction: TransactionSchema,
});
export type UpdateTransactionResponse = z.infer<
  typeof UpdateTransactionResponseSchema
>;
