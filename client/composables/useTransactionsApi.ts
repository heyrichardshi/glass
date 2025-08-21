import type {
  UpdateTransactionRequest,
  BulkUpdateTransactionsRequest,
} from "@saffron/types";
import useUpdateTransaction from "./api/transactions/useUpdateTransaction";
import useBulkUpdateTransactions from "./api/transactions/useBulkUpdateTransactions";
import useListTransactions from "./api/transactions/useListTransactions";
import useSearchTransactions from "./api/transactions/useSearchTransactions";
import type { TransactionSearchFilters } from "@saffron/types/schemas";

export default function () {
  const listTransactions = (params: {
    userId: string;
    paginationToken?: string;
  }) => useListTransactions(params);

  const searchTransactions = (params: {
    filters: TransactionSearchFilters;
    paginationToken?: string;
  }) => useSearchTransactions(params);

  const updateTransaction = (request: UpdateTransactionRequest) =>
    useUpdateTransaction(request);

  const bulkUpdateTransactions = (request: BulkUpdateTransactionsRequest) =>
    useBulkUpdateTransactions(request);

  return {
    listTransactions,
    searchTransactions,
    updateTransaction,
    bulkUpdateTransactions,
  };
}
