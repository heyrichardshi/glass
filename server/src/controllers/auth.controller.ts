import * as auth from "../services/auth.service";
import asyncController, {
  NoBody,
  NoParams,
  NoQuery,
} from "./asyncController";
import {
  AuthConfigResponse,
  ExchangeTokenBody,
  ExchangeTokenResponse,
} from "@glass/types/schemas";

export const getConfig = asyncController<
  NoParams,
  NoQuery,
  NoBody,
  AuthConfigResponse
>(async (req, res) => {
  const config = await auth.getAuthConfig();
  res.status(200).json(config);
});

export const exchangeToken = asyncController<
  NoParams,
  NoQuery,
  ExchangeTokenBody,
  ExchangeTokenResponse
>(async (req, res) => {
  const token = await auth.exchangeAuthorizationCode(req.body);
  res.status(200).json(token);
});
