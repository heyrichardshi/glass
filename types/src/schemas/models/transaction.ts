import { z } from 'zod';

export const TransactionCounterpartySchema = z.object({
  id: z.string(),
  type: z.enum(["merchant", "account"]),
});

export const TransactionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  householdId: z.string(),
  accountId: z.string(),
  amount: z.string(),
  currency: z.string(),
  rawDate: z.string(),
  date: z.string(),
  rawDescription: z.string(),
  description: z.string(),
  notes: z.string(),
  status: z.enum(["posted", "pending"]),
  counterparty: TransactionCounterpartySchema,
  categoryId: z.string(),
  tagIds: z.array(z.string()),
  linkedTransactionIds: z.array(z.string()),
});

export type TransactionCounterparty = z.infer<typeof TransactionCounterpartySchema>;
export type Transaction = z.infer<typeof TransactionSchema>; 