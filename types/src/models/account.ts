export interface Account {
  id: string;
  userId: string;
  name: string;
  institution: string;
  balance: string;
  /** The last four of the account number. */
  mask: string;
  /** What the financial institution refers to the account as. */
  officialName: string;
  transactionsLastRefreshedAt: string;
  /** Saffron's normalized account type, e.g. checking, savings, credit. */
  type: string;
  status: "open" | "closed" | "disconnected";
  /** The data provider backing this account. */
  provider?: "teller" | "plaid";
  tellerEnrollmentId?: string;
}
