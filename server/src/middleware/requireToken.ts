import { NextFunction, Request, Response } from "express";
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";
import { NO_ACCOUNT_ERROR_CODE } from "@glass/types/schemas";
import { ForbiddenError, UnauthorizedError } from "../common/errors";
import { UserIdentity } from "../models";
import { getJwksUri } from "../services/auth.service";
import { resolveUserId } from "../services/user.service";

// Extra fields on `req`. Express picks these up from the global Express.Request
// interface, which is the supported extension point. Augmenting the
// "express-serve-static-core" module by name does not work here: that package
// is not a direct dependency, so TypeScript cannot resolve it to merge into.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /** Set by requireToken. Present on every route mounted behind it. */
      token?: JWTPayload;
      /**
       * The caller's user ID, resolved from the verified token. Undefined when the token is valid
       * but no account holds its identity yet; see {@link requireUserId}.
       */
      userId?: string;
    }
  }
}

function env(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set; tokens cannot be verified.`);
  }
  return value;
}

let jwks: ReturnType<typeof createRemoteJWKSet> | undefined;

async function getJwks() {
  // createRemoteJWKSet caches keys internally and refetches when it meets an
  // unknown `kid`, so this is built once and reused rather than per request.
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(await getJwksUri()));
  }
  return jwks;
}

/**
 * Rejects any request without a valid tsidp token.
 */
export async function requireToken(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      throw new UnauthorizedError("Missing bearer token.");
    }

    // jose checks the signature against the JWKS and enforces exp and nbf;
    // issuer and audience are checked here so a token minted by another
    // provider, or for another client, is rejected even though it verifies.
    const { payload } = await jwtVerify(header.slice(7), await getJwks(), {
      issuer: env("OIDC_ISSUER"),
      audience: env("OIDC_AUDIENCE"),
    });

    req.token = payload;
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return next(error);
    }

    console.warn("Token verification failed:", error);
    return next(new UnauthorizedError("Invalid token."));
  }

  // Identity is derived from the verified token.
  const { iss, sub } = req.token;
  if (!iss || !sub) {
    return next(new UnauthorizedError("Token is missing an identity."));
  }

  try {
    // An unrecognised identity is left unresolved rather than rejected,
    // because enrolment has to be reachable by a caller who does not have an account yet.
    req.userId = await resolveUserId({ issuer: iss, subject: sub });
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
  const iss = req.token?.iss;
  const sub = req.token?.sub;
  if (!iss || !sub) {
    throw new UnauthorizedError("Token is missing an identity.");
  }
  return { issuer: iss, subject: sub };
}

export default requireToken;
