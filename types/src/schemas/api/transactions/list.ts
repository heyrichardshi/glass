import { z } from "zod";
import { TransactionSchema } from "../../models";

export const ListTransactionsQuerySchema = z.object({
  paginationToken: z.string().optional(),
});
export type ListTransactionsQuery = z.infer<typeof ListTransactionsQuerySchema>;

export const ListTransactionsResponseSchema = z.object({
  transactions: z.array(TransactionSchema),
  paginationToken: z.string().optional(),
});
export type ListTransactionsResponse = z.infer<
  typeof ListTransactionsResponseSchema
>;
