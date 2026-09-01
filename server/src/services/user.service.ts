import { UserIdentity } from "../models";
import { UserRepository } from "../repositories";

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
