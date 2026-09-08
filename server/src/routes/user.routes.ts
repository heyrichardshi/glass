import { Router } from "express";
import * as users from "../controllers/user.controller";
import {
  validateParams,
  validateRequest,
  validateResponse,
} from "../middleware/validation";
import {
  AttachIdentityParamsSchema,
  AttachIdentityResponseSchema,
  CreateUserBodySchema,
  CreateUserResponseSchema,
  ListUsersResponseSchema,
} from "@glass/types/schemas";

const router = Router();

router.get(
  "/users",
  validateResponse(ListUsersResponseSchema),
  users.listUsers,
);

router.post(
  "/users",
  validateRequest(CreateUserBodySchema),
  validateResponse(CreateUserResponseSchema),
  users.createUser,
);

router.post(
  "/users/:userId/identities",
  validateParams(AttachIdentityParamsSchema),
  validateResponse(AttachIdentityResponseSchema),
  users.attachIdentity,
);

export default router;
