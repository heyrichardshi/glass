import { Account } from "../models/account";
import * as teller from "./teller";

export async function registerAccountsFromToken(token: string) {
    // Retrieve accounts associated with this token from Teller
    console.log("Fetching accounts...");
    const tellerAccounts = await teller.listAccounts(token);
    console.log(`Fetched ${tellerAccounts.length} account(s)`);

    // Convert to own structure
    const accounts: Account[] = await Promise.all(
        tellerAccounts.map(async (account) => {
            console.log(`Retrieving balance for account ${account.name}...`);
            const balance = await teller.getAccountBalance(account.id, token);
            console.log(`Retrieved balance for account ${account.name}: ${balance.available} / ${balance.ledger}`);
            return {
                accountId: account.id,
                tellerAccessToken: token,
                name: account.name,
                institution: account.institution.name,
                balance: balance.ledger ?? "0",
                mask: account.last_four,
                officialName: account.name,
                transactionsLastRefreshedAt: new Date(0),
                type: account.type,
                status: account.status,
            };
        })
    );

    // Write accounts to database (TODO)
    console.log("Retrieved accounts:");
    accounts.forEach(account => {
        console.log(account);
    });
}
