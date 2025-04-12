import { NotFoundError } from "../common/errors";
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
                lastPostedTransactionId: "",
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
    const accountRepo = await AccountRepository.getInstance();

    const account = await accountRepo.findById(accountId)
    if (!account) {
        throw new NotFoundError(`Account with ID '${accountId}' not found`);
    }

    console.log("Fetching transactions...");
    const tellerTransactions = await teller.listAccountTransactions(accountId, account.tellerAccessToken);
    console.log(`Fetched ${tellerTransactions.length} transaction(s)`);

    let newestPostedTransactionId: string | undefined = undefined;

    const transactionsToWrite: Transaction[] = [];
    for (const transaction of tellerTransactions) {
        // Once we hit the last posted transaction, stop processing the rest, as there will be no updates.
        if (transaction.id == account.lastPostedTransactionId) {
            break;
        }

        // Since results are in reverse chronological order, the first posted transaction we hit is the newest.
        if (transaction.status == 'posted' && newestPostedTransactionId == undefined) {
            newestPostedTransactionId = transaction.id;
        }

        const status = transaction.status == 'posted' ? 'posted' : 'pending'
        // TODO get category + counterparty dynamically
        const categoryId = "0"
        const counterpartyId = "0"

        transactionsToWrite.push(
            {
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
        )
    }

    console.log(`Writing ${transactionsToWrite.length} new transactions`);
    transactionsToWrite.forEach(transaction => {
        console.log("Writing transaction to db: ", transaction);
        // TODO: Write transactions to database
    });

    if (newestPostedTransactionId !== undefined) {
        account.lastPostedTransactionId = newestPostedTransactionId;

        // TODO upsert account
    }
}
