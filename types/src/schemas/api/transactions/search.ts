import z from "zod";
import {
  TransactionSchema,
  TransactionSearchFiltersSchema,
} from "../../models";

export const SearchTransactionsBodySchema = z.object({
  filters: TransactionSearchFiltersSchema,
  paginationToken: z.string().optional(),
});
export type SearchTransactionsBody = z.infer<
  typeof SearchTransactionsBodySchema
>;

export const SearchTransactionsResponseSchema = z.object({
  transactions: z.array(TransactionSchema),
  paginationToken: z.string().optional(),
});
export type SearchTransactionsResponse = z.infer<
  typeof SearchTransactionsResponseSchema
>;
