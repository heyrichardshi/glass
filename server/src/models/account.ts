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
  transactionsLastRefreshedAt: Date;
  /** Used to keep track of the last posted transaction ID, to prevent extra reads. */
  lastPostedTransactionId: String;
  /** The type of the account, e.g. checking, savings, credit card. */
  type: string;
  status: "open" | "closed";
  tellerAccessToken: string;
  tellerEnrollmentId: string;
}
