import { Account } from "../models/account";

export interface GetAccountResponse {
    account: Account;
}

export interface ListAccountsResponse {
    accounts: Account[];
}
