# Data Model

## Entities

### Account
An _Account_ represents an account at a financial institution.

Properties:
- `accountId` – the identifier for this account; same as the account ID in Teller for more efficient lookups
- `tellerAccessToken` - used to authorize requests to the account in Teller
- `name` – the display name of the account, can be edited by the user
- `institution` - the name of the issuing party of the account
- `balance` – the current balance on the account
- `mask` – the last four digits of the account number
- `officialName` – what the financial institution calls the account
- `transactionsLastRefreshedAt` – a date/time value for when the transactions for this account was last retrieved (Unix time)
- `type` - `'credit'` or `'depository'`
- `status` - indicates whether the account is open, closed, or there is a connection issue with the account

### Transaction
A *Transaction* represents a transaction on an account at a financial institution. A transaction must have a counterparty, which is usually a Merchant, but may also be another Account in the case of transfers.

Properties:
- `transactionId` – the identifier for this transaction; same as the transaction ID in Teller for more efficient lookups
- `accountId` - the ID of the account this transaction belongs to
- `amount` - the signed amount of the transaction (as a string)
- `date` - the timestamp of the transaction (Unix time)
- `rawDescription` - the unprocessed transaction description as it appears on the bank statement
- `status` - `'posted'` or `'pending'`
- `tellerType` - the type code transaction, e.g. card_payment, according to Teller
- `tellerCategory` - the inferred category, according to Teller
- `tellerCounterparty` - the inferred counterparty, according to Teller
- `categoryId` - the ID of the category as defined by the user
- `counterpartyId` - the ID of the counterparty as defined by the user
- `tagIds` - a list of the IDs of the tags for this transaction as defined by the user

### Category
A *Category* represents any layer of categorization defined by a user. A top-level category has no parent. Lower-level categories have parents and parent chains, allowing breadcrumb-esque identification of a category.

Properties:
- `categoryId` - the ID of this category
- `parentId` - the ID of the parent category, if applicable
- `parentChain` - a list of parent IDs, from the top-level category to this category's parent
- `name` - the display name of the category

### Tag
A *Tag* represents non-categorical but classifying metadata to be associated with a transaction. Tags have no heirarchy.

Properties:
- `tagId` - the ID of this tag
- `name` - the display name of the tag

### Merchant
A *Merchant* represents a non-account counterparty to a transaction.

Properties
- `merchantId` - the ID of this merchant
- `name` - the display name of this merchant

## Access Patterns

### Read Patterns

For all queries returning transactions, transactions are expected to be in reverse chronological order (newest first).

1. Retrieve a transaction.
2. Retrieve an account with associated transactions.
3. List `n` most recent transactions across all accounts.
4. List `n` most recent transactions for a specific account.
5. List `n` most recent transactions for a specific category.
6. List `n` most recent transactions for a specific tag.
7. List `n` most recent transactions from a specific merchant.
8. List `n` most recent transactions between two dates.
9. List all accounts.
10. List all categories.
11. List all tags.

### Write Patterns

1. ...

## Schema

WIP