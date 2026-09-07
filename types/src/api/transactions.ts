import { Transaction, TransactionCounterparty } from "../models/transaction";

export interface ListTransactionsResponse {
  transactions: Transaction[];
  paginationToken?: string;
}

export interface UpdateTransactionRequest {
  transactionId: string;
  date?: string;
  description?: string;
  notes?: string;
  categoryId?: string;
  tagIds?: string[];
  counterparty?: TransactionCounterparty;
}

export interface UpdateTransactionResponse {
  transaction: Transaction;
}

export interface BulkUpdateTransactionsRequest {
  transactionIds: string[];
  updates: {
    categoryId?: string;
    tagIds?: string[];
    counterparty?: TransactionCounterparty;
  };
}

export interface BulkUpdateTransactionsResponse {
  updatedTransactions: Transaction[];
  failedUpdates: {
    transactionId: string;
    error: string;
  }[];
}
