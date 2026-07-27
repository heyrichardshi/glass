import * as accounts from "../services/account.service";
import asyncController, { NoBody, NoParams, NoQuery } from "./asyncController";
import {
  ConnectionTokenResponse,
  ListAccountsQuery,
  ListAccountsResponse,
  RefreshAccountParams,
  RefreshAccountResponse,
  RegisterAccountsBody,
  RegisterAccountsResponse,
} from "@saffron/types/schemas";

export const registerAccounts = asyncController<
  NoParams,
  NoQuery,
  RegisterAccountsBody,
  RegisterAccountsResponse
>(async (req, res) => {
  const { exchangeToken } = req.body;

  const response = await accounts.exchangePlaidPublicToken(exchangeToken);
  res.status(201).json(response);
});

export const refreshAccount = asyncController<
  RefreshAccountParams,
  NoQuery,
  NoBody,
  RefreshAccountResponse
>(async (req, res) => {
  await accounts.refresh(req.params.accountId);
  res.status(200).send();
});

export const getConnectionToken = asyncController<
  NoParams,
  NoQuery,
  NoBody,
  ConnectionTokenResponse
>(async (req, res) => {
  const connectionToken = await accounts.createPlaidLinkToken();
  res.status(200).json({ connectionToken });
});

export const listAccountsForUser = asyncController<
  NoParams,
  ListAccountsQuery,
  NoBody,
  ListAccountsResponse
>(async (req, res) => {
  const { userId } = req.query;

  const accountsList = await accounts.listForUser(userId);
  res.status(200).json(accountsList);
});
