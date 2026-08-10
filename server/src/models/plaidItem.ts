/**
 * Represents a Plaid Item: a single login/connection to one financial institution. An Item can
 * contain multiple accounts. The access token and transactions sync cursor are per-Item, so they
 * live here rather than being duplicated onto each account.
 */
export interface PlaidItem {
  /** The Plaid item_id; the primary key of this record. */
  id: string;
  userId: string;
  householdId: string;
  /** The Plaid access token for this Item (secret). */
  accessToken: string;
  /** The /transactions/sync cursor; undefined until the first sync completes. */
  cursor?: string;
  /** Plaid institution_id for this Item's institution. */
  institutionId?: string;
  /** Display name of the institution. */
  institutionName?: string;
  /**
   * Raw Plaid error code from the most recent operation (e.g. ITEM_LOGIN_REQUIRED), or undefined
   * when healthy. This is raw provider state; Glass's own account status is derived separately.
   */
  errorCode?: string;
}
