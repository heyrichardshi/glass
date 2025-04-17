import { Account } from "../models/account";

export interface RegisterAccountsResponse {
  accountsRegisteredCount: number;
}

export interface GetAccountResponse {
  account: Account;
}

export interface ListAccountsResponse {
  accounts: Account[];
}
