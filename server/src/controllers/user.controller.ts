import { requireIdentity } from "../middleware/requireToken";
import * as users from "../services/user.service";
import asyncController, { NoBody, NoParams, NoQuery } from "./asyncController";
import {
  AttachIdentityParams,
  AttachIdentityResponse,
  CreateUserBody,
  CreateUserResponse,
  ListUsersResponse,
} from "@glass/types/schemas";

export const listUsers = asyncController<
  NoParams,
  NoQuery,
  NoBody,
  ListUsersResponse
>(async (_req, res) => {
  const response = await users.listUsers();
  res.status(200).json(response);
});

export const createUser = asyncController<
  NoParams,
  NoQuery,
  CreateUserBody,
  CreateUserResponse
>(async (req, res) => {
  const user = await users.createUser(requireIdentity(req), req.body.name);
  res.status(201).json(user);
});

export const attachIdentity = asyncController<
  AttachIdentityParams,
  NoQuery,
  NoBody,
  AttachIdentityResponse
>(async (req, res) => {
  const user = await users.attachIdentity(
    requireIdentity(req),
    req.params.userId,
  );
  res.status(200).json(user);
});
