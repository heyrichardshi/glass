import { Account } from "../models/account";
import { CategoryTransactions, TagTransactions } from "../models/analytics";
import { Transaction } from "../models/transaction";

export interface GetMonthlyReportRequest {
  userId: string;
  year: string;
  month: string;
}

export interface GetMonthlyReportResponse {
  year: string;
  month: string;
  totalIncome: string;
  totalExpense: string;
  categoryIncome: CategoryTransactions[];
  categoryExpenses: CategoryTransactions[];
  tagExpenses: TagTransactions[];
  /** A map where the key is the account ID and the value is the account object. */
  accounts: Record<string, Account>;
  /** A map where the key is the transaction ID and the value is the transaction object. */
  transactions: Record<string, Transaction>;
}
