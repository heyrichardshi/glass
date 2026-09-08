import { UserIdentity, toApiUser } from "../models";
import { UserRepository } from "../repositories";
import { ConflictError, NotFoundError } from "../common/errors";
import { randomUUID } from "crypto";
import {
  AttachIdentityResponse,
  CreateUserResponse,
  ListUsersResponse,
} from "@glass/types";

/**
 * Maps `issuer|subject` to a user ID, as an in-process cache.
 */
const userIdsByIdentity = new Map<string, string>();

function toCacheKey(identity: UserIdentity): string {
  return `${identity.issuer}|${identity.subject}`;
}

/**
 * Resolves a verified token's {issuer, subject} to a user ID, or `undefined` when no account holds
 * that pair yet.
 */
export async function resolveUserId(
  identity: UserIdentity,
): Promise<string | undefined> {
  const cacheKey = toCacheKey(identity);

  const cached = userIdsByIdentity.get(cacheKey);
  if (cached) {
    return cached;
  }

  const userRepo = await UserRepository.getInstance();
  const user = await userRepo.findByIdentity(identity);
  if (!user) {
    return undefined;
  }

  userIdsByIdentity.set(cacheKey, user.id);
  return user.id;
}

function rememberUserId(identity: UserIdentity, userId: string): void {
  userIdsByIdentity.set(toCacheKey(identity), userId);
}

export async function listUsers(): Promise<ListUsersResponse> {
  const userRepo = await UserRepository.getInstance();
  const users = await userRepo.list();
  users.sort((a, b) => a.name.localeCompare(b.name));
  return { users: users.map(toApiUser) };
}

/**
 * Creates a Glass account for this identity.
 * If the pair is already linked, returns that account.
 * Otherwise, creates a new account and returns it.
 */
export async function createUser(
  identity: UserIdentity,
  name: string,
): Promise<CreateUserResponse> {
  const userRepo = await UserRepository.getInstance();

  const existing = await userRepo.findByIdentity(identity);
  if (existing) {
    rememberUserId(identity, existing.id);
    return { user: toApiUser(existing) };
  }

  const created = await userRepo.create({
    id: randomUUID(),
    identities: [identity],
    name,
  });

  rememberUserId(identity, created.id);
  console.log(
    `Created user ${created.id} for identity ${identity.issuer}|${identity.subject}`,
  );

  return { user: toApiUser(created) };
}

/**
 * Appends this identity to an existing account.
 * Idempotent when the pair is already on that account.
 * Refused when the pair already belongs to a different account.
 */
export async function attachIdentity(
  identity: UserIdentity,
  userId: string,
): Promise<AttachIdentityResponse> {
  const userRepo = await UserRepository.getInstance();

  const holder = await userRepo.findByIdentity(identity);
  if (holder && holder.id !== userId) {
    throw new ConflictError(
      "This identity is already linked to a different account.",
    );
  }

  const updated = await userRepo.appendIdentity(userId, identity);
  if (!updated) {
    throw new NotFoundError(`User '${userId}' does not exist.`);
  }

  rememberUserId(identity, updated.id);

  if (!holder) {
    console.log(
      `Attached identity ${identity.issuer}|${identity.subject} to user ${updated.id}`,
    );
  }

  return { user: toApiUser(updated) };
}
