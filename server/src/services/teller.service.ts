import axios, { AxiosError } from "axios";
import fs from "fs";
import https from "https";
import { Account, AccountBalance, Transaction } from "../models/teller";
import {
  ForbiddenError,
  TellerAccountDisconnectedError,
} from "../common/errors";

const baseUrl = "https://api.teller.io";
const ENROLLMENT_DISCONNECTED_ERROR_CODE =
  "enrollment.disconnected.user_action.mfa_required";

// Cache the HTTPS agent to minimize fs reads
let _tellerHttpsAgent: https.Agent | undefined;
async function teller(endpoint: string, token: string) {
  if (_tellerHttpsAgent === undefined) {
    // Load the certificate and private key
    console.log(`CERT PATH: ${process.env.TELLER_CERTIFICATE_PATH}`);
    const cert = fs.readFileSync(process.env.TELLER_CERTIFICATE_PATH || "");
    const key = fs.readFileSync(process.env.TELLER_KEY_PATH || "");

    // Create an HTTPS agent with the certificate and key
    _tellerHttpsAgent = new https.Agent({
      cert,
      key,
    });
  }

  // Make the request
  try {
    console.log(`Making request to ${baseUrl}${endpoint}`);
    const response = await axios.get(`${baseUrl}${endpoint}`, {
      httpsAgent: _tellerHttpsAgent,
      auth: {
        username: token,
        password: "", // No password for Teller auth as it relies on cert and key
      },
    });
    // console.log("Response data:", response.data);
    return response.data;
  } catch (error: unknown) {
    if (error instanceof AxiosError) {
      console.error(
        `Error when calling Teller API '${baseUrl}${endpoint}': (${error.status} | ${error.code}) ${error.message}`,
      );

      switch (error.status) {
        case 403:
          throw new ForbiddenError(error.message);
        case 404:
          const errorCode = error.response?.data?.error?.code;
          if (errorCode === ENROLLMENT_DISCONNECTED_ERROR_CODE) {
            throw new TellerAccountDisconnectedError(error.message);
          }
          throw new Error(
            `Error fetching data from Teller API (unknown 404): ${JSON.stringify(error.response?.data, null, 2)}`,
          );
        default:
          throw new Error(
            `Error fetching data from Teller API: ${error.status} / ${JSON.stringify(error.response?.data, null, 2)}`,
          );
      }
    }
  }
}

export async function listAccounts(token: string): Promise<Account[]> {
  return (await teller("/accounts", token)) as Account[];
}

export async function getAccount(accountId: string, token: string) {
  return (await teller(`/accounts/${accountId}`, token)) as Account;
}

export async function getAccountBalance(accountId: string, token: string) {
  return (await teller(
    `/accounts/${accountId}/balances`,
    token,
  )) as AccountBalance;
}

/**
 * Returns an array of transactions in reverse chronological order (newest first).
 *
 * See https://teller.io/docs/api/account/transactions#list-transactions.
 *
 * @param limit how many transactions to return at once;
 * @param fromPage the transaction from which to start the page; the first transaction in the response is the one that
 * is chronologically before this transaction.
 * @returns
 */
export async function listAccountTransactions(
  accountId: string,
  token: string,
  limit?: number,
  fromPage?: string,
) {
  let endpoint = `/accounts/${accountId}/transactions?`;
  if (limit != null) {
    endpoint += `count=${limit}&`;
  }
  if (fromPage != null) {
    endpoint += `from_id=${fromPage}`;
  }
  return (await teller(endpoint, token)) as Transaction[];
}
