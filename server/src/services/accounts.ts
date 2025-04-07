import { Account, Transaction } from "../models";
import { AccountRepository } from "../repositories/account";
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
                id: account.id,
                userId: "0", // TODO: multitenancy
                name: account.name,
                institution: account.institution.name,
                balance: balance.ledger ?? "0",
                mask: account.last_four,
                officialName: account.name,
                transactionsLastRefreshedAt: new Date(0),
                type: account.type,
                status: account.status == 'open' ? 'open' : 'closed',
                tellerAccessToken: token,
            };
        })
    );

    const accountRepo = await AccountRepository.getInstance();

    console.log("Retrieved accounts:");
    accounts.forEach(account => {
        console.log("Writing account to db: ", account);
        accountRepo.create(account).then((statusCode) => {
            console.log(`Account creation status: ${statusCode}`);
        }).catch((error) => {
            console.error("Error writing account to db: ", error);
        });
    });
}

/**
 * Retrieves latest balance and transaction data for the given account from Teller, and updates the database.
 */
export async function refresh(accountId: string) {
    // TODO: Get registered account, if it exists.
    const token = "token_vhlf3gfbtfa2xqgih3hnhpvpre"
    console.log(token);

    const account = teller.getAccount(accountId, token);
    const balance = teller.getAccountBalance(accountId, token);

    console.log("Fetching transactions...");
    const tellerTransactions = await teller.listAccountTransactions(accountId, token);
    console.log(`Fetched ${tellerTransactions.length} transaction(s)`);

    // Convert to own structure
    const transactions: Transaction[] = await Promise.all(
        tellerTransactions.map(async (transaction) => {
            const status = transaction.status == 'posted' ? 'posted' : 'pending'
            // TODO get category + counterparty dynamically
            const categoryId = "0"
            const counterpartyId = "0"
            return {
                id: transaction.id,
                userId: "0", // TODO: multitenancy
                accountId: accountId,
                amount: transaction.amount,
                currency: "USD",
                date: new Date(transaction.date),
                rawDescription: transaction.description,
                description: transaction.description,
                notes: "",
                status: status,
                counterparty: {
                    id: counterpartyId,
                    type: "merchant",
                },
                categoryId: categoryId,
                tagIds: [],
                linkedTransactionIds: [],
                history: [],
                tellerMetadata: {
                    type: transaction.type,
                    category: transaction.details.category,
                    counterparty: transaction.details.counterparty?.name,
                },
            }
        })
    );

    // TODO: Write transactions to database
}
