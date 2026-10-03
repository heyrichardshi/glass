import { NextFunction, Request, Response } from "express";
import { NO_ACCOUNT_ERROR_CODE } from "@glass/types/schemas";
import { ForbiddenError, UnauthorizedError } from "../common/errors";
import { childLogger } from "../common/logger";
import { UserIdentity } from "../models";
import { verifySessionToken } from "../services/session.service";
import { resolveUserId } from "../services/user.service";

const log = childLogger("requireToken");

// Extra fields on `req`. Express picks these up from the global Express.Request
// interface, which is the supported extension point. Augmenting the
// "express-serve-static-core" module by name does not work here: that package
// is not a direct dependency, so TypeScript cannot resolve it to merge into.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /** Set by requireToken. Present on every route mounted behind it. */
      identity?: UserIdentity;
      /**
       * The caller's user ID, resolved from the verified token. Undefined when the token is valid
       * but no account holds its identity yet; see {@link requireUserId}.
       */
      userId?: string;
    }
  }
}

/**
 * Rejects any request without a valid Glass session token.
 */
export async function requireToken(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  let identity: UserIdentity;
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      throw new UnauthorizedError("Missing bearer token.");
    }

    identity = await verifySessionToken(header.slice(7));
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return next(error);
    }

    log.warn({ err: error }, "token verification failed");
    return next(new UnauthorizedError("Invalid token."));
  }

  req.identity = identity;

  try {
    // An unrecognised identity is left unresolved rather than rejected,
    // because enrolment has to be reachable by a caller who does not have an account yet.
    req.userId = await resolveUserId(identity);
  } catch (error) {
    return next(error);
  }

  next();
}

/**
 * Throws when the token verified but no account holds its identity.
 * The client interceptor recognises {@link NO_ACCOUNT_ERROR_CODE} and routes to enrollment.
 */
export function requireUserId(req: Request): string {
  if (!req.userId) {
    throw new ForbiddenError(
      "No Glass account is linked to this identity yet.",
      NO_ACCOUNT_ERROR_CODE,
    );
  }
  return req.userId;
}

/**
 * The verified {issuer, subject} pair.
 */
export function requireIdentity(req: Request): UserIdentity {
  if (!req.identity) {
    throw new UnauthorizedError("Token is missing an identity.");
  }
  return req.identity;
}

export default requireToken;
