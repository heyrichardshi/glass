import axios from 'axios';
import fs from 'fs';
import https from 'https';
import { Account, AccountBalance, Transaction } from '../models/teller';

const baseUrl = "https://api.teller.io";

// Cache the HTTPS agent to minimize fs reads
let _tellerHttpsAgent: https.Agent | undefined;
async function teller(endpoint: string, token: string) {
    if (_tellerHttpsAgent === undefined) {
        // Load the certificate and private key
        console.log(`CERT PATH: ${process.env.TELLER_CERTIFICATE_PATH}`);
        const cert = fs.readFileSync(process.env.TELLER_CERTIFICATE_PATH || '');
        const key = fs.readFileSync(process.env.TELLER_KEY_PATH || '');

        // Create an HTTPS agent with the certificate and key
        _tellerHttpsAgent = new https.Agent({
            cert,
            key,
        });
    }

    // Make the request
    try {
        const response = await axios
            .get(`${baseUrl}${endpoint}`, {
                httpsAgent: _tellerHttpsAgent,
                auth: {
                    username: token,
                    password: "", // No password for Teller auth as it relies on cert and key
                },
            });
        console.log("Response data:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error:", error.response ? error.response.data : error.message);
    }
}

export async function listAccounts(token: string): Promise<Account[]> {
    return await teller("/accounts", token) as Account[];
}

export async function getAccount(accountId: string, token: string) {
    return await teller(`/accounts/${accountId}`, token) as Account;
}

export async function getAccountBalance(accountId: string, token: string) {
    return await teller(`/accounts/${accountId}/balances`, token) as AccountBalance;
}

export async function listAccountTransactions(accountId: string, token: string, limit?: number, fromPage?: string) {
    let endpoint = `/accounts/${accountId}/transactions?`;
    if (limit != null) {
        endpoint += `limit=${limit}`;
    }
    if (fromPage != null) {
        endpoint += `from_id=${fromPage}`
    }
    return await teller(endpoint, token) as Transaction[];
}
