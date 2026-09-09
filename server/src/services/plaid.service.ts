import axios from "axios";
import {
  Configuration,
  CountryCode,
  PlaidApi,
  PlaidEnvironments,
  Products,
  type AccountBase,
  type LinkTokenCreateRequest,
  type RemovedTransaction,
  type Transaction as PlaidTransaction,
  type TransactionsUpdateStatus,
} from "plaid";
import { childLogger } from "../common/logger";

const log = childLogger("plaid.service");

/** Plaid's documented maximum for `/transactions/sync` `count`. */
const SYNC_PAGE_SIZE = 500;

// Glass aggregates Transactions for US institutions. These are product decisions, not
// deployment config, so they are hardcoded rather than read from the environment.
const PLAID_PRODUCTS: Products[] = [Products.Transactions];
const PLAID_COUNTRY_CODES: CountryCode[] = [CountryCode.Us];

let _client: PlaidApi | undefined;

function getClient(): PlaidApi {
  if (_client) {
    return _client;
  }

  const clientId = process.env.PLAID_CLIENT_ID || "";
  const secret = process.env.PLAID_SECRET || "";
  if (!clientId || !secret) {
    throw new Error(
      "Plaid credentials missing: set PLAID_CLIENT_ID and PLAID_SECRET in the environment.",
    );
  }

  const env = (process.env.PLAID_ENV || "sandbox").toLowerCase();
  const basePath = PlaidEnvironments[env as keyof typeof PlaidEnvironments];
  if (!basePath) {
    throw new Error(
      `Unknown PLAID_ENV '${env}'. Expected 'sandbox' or 'production'.`,
    );
  }

  const configuration = new Configuration({
    basePath,
    baseOptions: {
      headers: {
        "PLAID-CLIENT-ID": clientId,
        "PLAID-SECRET": secret,
      },
    },
  });

  _client = new PlaidApi(configuration);
  return _client;
}

/**
 * Creates a short-lived Link token the client uses to open Plaid Link for a given user.
 *
 * Pass `accessToken` to launch Link in update mode against an existing Item (e.g. to
 * re-authenticate after ITEM_LOGIN_REQUIRED, or to add products). In update mode `products`
 * must be omitted; otherwise the Item is initialized with the default products.
 */
export async function createLinkToken(
  userId: string,
  accessToken?: string,
): Promise<string> {
  const request: LinkTokenCreateRequest = {
    user: { client_user_id: userId },
    client_name: "Glass",
    country_codes: PLAID_COUNTRY_CODES,
    language: "en",
    ...(accessToken
      ? { access_token: accessToken }
      : { products: PLAID_PRODUCTS }),
  };
  const response = await getClient().linkTokenCreate(request);
  return response.data.link_token;
}

/**
 * Exchanges the public token returned by Plaid Link for a long-lived access token + item id.
 */
export async function exchangePublicToken(
  publicToken: string,
): Promise<{ accessToken: string; itemId: string }> {
  const response = await getClient().itemPublicTokenExchange({
    public_token: publicToken,
  });
  return {
    accessToken: response.data.access_token,
    itemId: response.data.item_id,
  };
}

/**
 * Returns the accounts for an Item along with the Item's institution id.
 */
export async function getAccounts(
  accessToken: string,
): Promise<{ accounts: AccountBase[]; institutionId?: string | null }> {
  const response = await getClient().accountsGet({ access_token: accessToken });
  return {
    accounts: response.data.accounts,
    institutionId: response.data.item.institution_id,
  };
}

export async function getInstitutionName(
  institutionId: string,
): Promise<string | undefined> {
  const response = await getClient().institutionsGetById({
    institution_id: institutionId,
    country_codes: PLAID_COUNTRY_CODES,
  });
  return response.data.institution.name;
}

/**
 * A fully-paged `/transactions/sync` result.
 * 
 * **Note: A pending removal and its posted replacement are not guaranteed to share a page.**
 */
export interface TransactionSyncUpdate {
  added: PlaidTransaction[];
  modified: PlaidTransaction[];
  removed: RemovedTransaction[];
  /** Empty when Plaid has not yet produced a cursor (transactions not ready). */
  nextCursor: string;
  pages: number;
  updateStatus: TransactionsUpdateStatus;
}

/**
 * Pages `/transactions/sync` until `has_more` is false.
 * When cursor is omitted, the full history from the first added transaction is requested.
 */
export async function syncTransactions(
  accessToken: string,
  cursor?: string,
): Promise<TransactionSyncUpdate> {
  const added: PlaidTransaction[] = [];
  const modified: PlaidTransaction[] = [];
  const removed: RemovedTransaction[] = [];
  let nextCursor = cursor ?? "";
  let pages = 0;
  let hasMore = true;
  let updateStatus: TransactionsUpdateStatus | undefined;

  while (hasMore) {
    const response = await getClient().transactionsSync({
      access_token: accessToken,
      cursor: nextCursor || undefined,
      count: SYNC_PAGE_SIZE,
      options: { include_original_description: true },
    });
    const page = response.data;
    added.push(...page.added);
    modified.push(...page.modified);
    removed.push(...page.removed);
    nextCursor = page.next_cursor;
    hasMore = page.has_more;
    updateStatus = page.transactions_update_status;
    pages += 1;
  }

  if (updateStatus === undefined) {
    throw new Error("Plaid /transactions/sync returned no pages");
  }

  log.info(
    {
      pages,
      added: added.length,
      modified: modified.length,
      removed: removed.length,
    },
    "fetched transaction sync pages",
  );

  return {
    added,
    modified,
    removed,
    nextCursor,
    pages,
    updateStatus,
  };
}

/** Reads `error_code` off a Plaid API error, or `undefined` if this is not one. */
export function getPlaidErrorCode(error: unknown): string | undefined {
  if (!axios.isAxiosError(error)) {
    return undefined;
  }
  const code = error.response?.data?.error_code;
  return typeof code === "string" ? code : undefined;
}
