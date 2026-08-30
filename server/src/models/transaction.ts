import type { Account } from "./account";
import type { Merchant } from "./merchant";
import type { Tag } from "./tag";

/**
 * Represents a transaction on an {@link Account | account} at a financial institution.
 * It must have a counterparty, which is usually a {@link Merchant | merchant},
 * but may also be another account in the case of transfers.
 */
export interface Transaction {
  /** The identifier for this transaction; same as the provider's transaction ID for more efficient lookups. */
  id: string;
  /** The user to which this transaction belongs to. */
  userId: string;
  /** The household which the user whose acount this transaction belongs to is a part of; defaults to user's own household. */
  householdId: string;
  /** The ID of the account this transaction belongs to. */
  accountId: string;
  /** The signed amount of the transaction (as a string). */
  amount: string;
  /** The currency in which the amount was charged. */
  currency: string;
  /** The timestamp of the transaction as it appears on the bank statement. */
  rawDate: string;
  /** The timestamp of the transaction (Unix time). */
  date: string;
  /** The unprocessed transaction description as it appears on the bank statement. */
  rawDescription: string;
  /** The user-provided description of the transaction. Defaults to the raw description. */
  description: string;
  /** A non-indexed field a user can use to store additional information about a transaction. */
  notes: string;
  /** The status of the transaction, either 'posted' or 'pending'. */
  status: "posted" | "pending";
  /** The counterparty of the transaction; inferred on ingestion and can be modified by the user. */
  counterparty: TransactionCounterparty;
  /** The ID of the category as defined by the user. */
  categoryId: string;
  /** A list of the IDs of the {@link Tag | tags} for this transaction as defined by the user. */
  tagIds: string[];
  /** A related transaction, e.g. a refund or transfer. */
  linkedTransactionIds: string[];

  history: TransactionHistory[];

  /** Plaid-provided metadata (present on Plaid-sourced rows). */
  plaidMetadata?: TransactionPlaidMetadata;
  /** The Plaid transaction_id; used to match incoming Plaid sync results to this row. */
  plaidTransactionId?: string;
  /** For a posted Plaid transaction, the transaction_id of the pending transaction it replaced. */
  plaidPendingTransactionId?: string;
}

export interface TransactionCounterparty {
  id: string;
  type: "merchant" | "account";
}

export interface TransactionHistory {
  timestamp: Date;
  changes: Partial<Transaction>;
}

export interface TransactionPlaidMetadata {
  /** Plaid's personal_finance_category (primary/detailed), if provided. */
  personalFinanceCategory?: string;
  /** Plaid's enriched merchant name, if provided. */
  merchantName?: string;
  /** Plaid's stable merchant identifier (merchant_entity_id); enables reliable merchant matching. */
  merchantEntityId?: string;
  /** Plaid's merchant logo URL, if provided. */
  merchantLogoUrl?: string;
  /** Plaid's merchant website, if provided. */
  merchantWebsite?: string;
  /** Plaid's authorized_date (when the transaction was authorized), distinct from the posted `date`. */
  authorizedDate?: string;
}

export interface TransactionsList {
  transactions: Transaction[];
  paginationToken?: string;
}
