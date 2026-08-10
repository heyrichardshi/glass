import * as auth from "../services/auth.service";
import asyncController, { NoParams, NoQuery } from "./asyncController";
import {
  ExchangeTokenBody,
  ExchangeTokenResponse,
} from "@glass/types/schemas";

export const exchangeToken = asyncController<
  NoParams,
  NoQuery,
  ExchangeTokenBody,
  ExchangeTokenResponse
>(async (req, res) => {
  const token = await auth.exchangeAuthorizationCode(req.body);
  res.status(200).json(token);
});
