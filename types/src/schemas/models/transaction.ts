import { z } from "zod";

export const TransactionCounterpartySchema = z.object({
  id: z.string(),
  type: z.enum(["merchant", "account"]),
});

export const TransactionSchema = z.object({
  id: z.string(),
  userId: z.string(),
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

export type TransactionCounterparty = z.infer<
  typeof TransactionCounterpartySchema
>;
export type Transaction = z.infer<typeof TransactionSchema>;

export const TransactionSearchFiltersSchema = z.object({
  /* If provided, return transactions with this text in the description. */
  searchText: z.string().optional(),

  /* If provided, only return transactions from any of these accounts. */
  accountIds: z.array(z.string()).optional(),

  /* If provided, only return transactions from any of these merchants. */
  merchantIds: z.array(z.string()).optional(),

  /* If provided, only return transactions from any of these categories. */
  categoryIds: z.array(z.string()).optional(),

  /* If provided, only return transactions with any of these tags. */
  tagIds: z.array(z.string()).optional(),

  /* If provided, only return transactions from this date onwards. */
  startDate: z.string().optional().describe("ISO 8601 date string"),

  /* If provided, only return transactions up to this date. */
  endDate: z.string().optional().describe("ISO 8601 date string"),
});
export type TransactionSearchFilters = z.infer<
  typeof TransactionSearchFiltersSchema
>;
