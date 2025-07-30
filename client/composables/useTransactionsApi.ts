import type {
  UpdateTransactionRequest,
  BulkUpdateTransactionsRequest,
} from "@saffron/types";
import useUpdateTransaction from "./api/transactions/useUpdateTransaction";
import useBulkUpdateTransactions from "./api/transactions/useBulkUpdateTransactions";

export default function () {
  const updateTransaction = (request: UpdateTransactionRequest) =>
    useUpdateTransaction(request);

  const bulkUpdateTransactions = (request: BulkUpdateTransactionsRequest) =>
    useBulkUpdateTransactions(request);

  return { updateTransaction, bulkUpdateTransactions };
}
