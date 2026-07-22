import {
  Configuration,
  CountryCode,
  PlaidApi,
  PlaidEnvironments,
  Products,
  type AccountBase,
} from "plaid";

// Saffron aggregates Transactions for US institutions. These are product decisions, not
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
 */
export async function createLinkToken(userId: string): Promise<string> {
  const response = await getClient().linkTokenCreate({
    user: { client_user_id: userId },
    client_name: "Saffron",
    products: PLAID_PRODUCTS,
    country_codes: PLAID_COUNTRY_CODES,
    language: "en",
  });
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
