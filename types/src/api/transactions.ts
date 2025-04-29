import { Transaction } from "../models/transaction";

export interface ListTransactionsResponse {
  transactions: Transaction[];
  paginationToken?: string;
}

export interface UpdateTransactionRequest {
  userId: string;
  transactionId: string;
  date?: string;
  description?: string;
  notes?: string;
  categoryId?: string;
  tagIds?: string[];
}

export interface UpdateTransactionResponse {
  transaction: Transaction;
}
