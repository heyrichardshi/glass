import * as accounts from "../services/accounts";
import asyncController, { NoBody, NoParams, NoQuery } from "./asyncController";
import {
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
  const { accessToken } = req.body;

  const response = await accounts.registerAccountsFromToken(accessToken);
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
