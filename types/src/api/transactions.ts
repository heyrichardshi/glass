import { Transaction } from "../models/transaction";

export interface ListTransactionsResponse {
  transactions: Transaction[];
  paginationToken?: string;
}
