export interface Transaction {
  id: string;
  userId: string;
  householdId: string;
  accountId: string;
  amount: string;
  currency: string;
  date: Date;
  rawDescription: string;
  description: string;
  notes: string;
  status: "posted" | "pending";
  counterparty: TransactionCounterparty;
  categoryId: string;
  tagIds: string[];
  linkedTransactionIds: string[];
}

export interface TransactionCounterparty {
  id: string;
  type: "merchant" | "account";
}
