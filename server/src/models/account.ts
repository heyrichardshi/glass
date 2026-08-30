/**
 * Glass's own normalized account type. Provider type/subtype values are mapped onto this
 * vocabulary; the raw provider values are kept in provider-specific metadata rather than here.
 */
export type AccountType =
  | "checking"
  | "savings"
  | "credit"
  | "loan"
  | "investment"
  | "other";

export interface Account {
  id: string;
  userId: string;
  householdId: string;
  name: string;
  institution: string;
  balance: string;
  /** The last four of the account number. */
  mask: string;
  /** What the financial institution refers to the account as. */
  officialName: string;
  transactionsLastRefreshedAt: string;
  /** Used to keep track of the last posted transaction ID, to prevent extra reads. */
  lastPostedTransactionId: String;
  /** Glass's normalized account type; provider-specific values are mapped onto this. */
  type: AccountType;
  /**
   * Glass's own connection status, intentionally independent of any single provider's data model.
   * Provider-specific signals (e.g. a Plaid item error like ITEM_LOGIN_REQUIRED) are mapped onto
   * this enum rather than stored as the source of truth.
   */
  status: "open" | "closed" | "disconnected";

  // Plaid linkage keys used operationally to sync. The access token and sync cursor are stored
  // separately per institution login, not on the account.
  /** Identifies the Plaid institution login (Item) this account belongs to. */
  plaidItemId?: string;
  /** The Plaid account_id for this account. */
  plaidAccountId?: string;
  /** Raw provider-specific descriptors kept out of Glass's core model. */
  plaidMetadata?: AccountPlaidMetadata;
}

export interface AccountPlaidMetadata {
  /** Plaid's account subtype, e.g. "checking", "savings", "credit card". */
  subtype?: string;
  /** Plaid's stable institution_id. */
  institutionId?: string;
}
