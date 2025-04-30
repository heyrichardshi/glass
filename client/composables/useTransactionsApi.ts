import type { UpdateTransactionRequest } from "@saffron/types";
import useUpdateTransaction from "./api/transactions/useUpdateTransaction";

export default function () {
  const updateTransaction = (request: UpdateTransactionRequest) =>
    useUpdateTransaction(request);

  return { updateTransaction };
}
