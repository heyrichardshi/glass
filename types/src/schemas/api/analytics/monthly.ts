import { z } from "zod";
import {
  AccountSchema,
  CategorySchema,
  TagSchema,
  TransactionSchema,
} from "../../models";

export const GetMonthlyReportQuerySchema = z.object({
  userId: z.string(),
  year: z.string(),
  month: z.string(),
});
export type GetMonthlyReportQuery = z.infer<typeof GetMonthlyReportQuerySchema>;

export const CategoryTransactionsSchema = z.object({
  category: CategorySchema,
  totalAmount: z.string(),
  transactionIds: z.array(z.string()),
  subcategoryTransactions: z.array(z.any()),
});

export const TagTransactionsSchema = z.object({
  tag: TagSchema,
  totalAmount: z.string(),
  transactionIds: z.array(z.string()),
});

export const GetMonthlyReportResponseSchema = z.object({
  year: z.string(),
  month: z.string(),
  totalIncome: z.string(),
  totalExpense: z.string(),
  categoryIncome: z.array(CategoryTransactionsSchema),
  categoryExpenses: z.array(CategoryTransactionsSchema),
  tagExpenses: z.array(TagTransactionsSchema),
  accounts: z.record(z.string(), AccountSchema),
  transactions: z.record(z.string(), TransactionSchema),
});
export type GetMonthlyReportResponse = z.infer<
  typeof GetMonthlyReportResponseSchema
>;
