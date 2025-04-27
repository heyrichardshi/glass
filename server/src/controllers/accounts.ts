import * as accounts from "../services/accounts";
import asyncController from "./asyncController";
import { InvalidInputError } from "../common/errors";

export const registerAccounts = asyncController(async (req, res) => {
  const accessToken = req.query.accessToken as string | undefined;
  if (!accessToken) {
    throw new InvalidInputError("accessToken");
  }

  const response = await accounts.registerAccountsFromToken(accessToken);
  res.status(200).json(response);
});

export const refreshAccount = asyncController(async (req, res) => {
  await accounts.refresh(req.params.accountId);
  res.status(200).send();
});

export const listAccountsForUser = asyncController(async (req, res) => {
  const userId = req.query.userId as string | undefined; // ?userId=...
  console.log("userId:", userId);

  if (!userId) {
    throw new InvalidInputError("userId");
  }

  const accountsList = await accounts.listForUser(userId);
  res.status(200).json(accountsList);
});
