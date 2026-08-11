import { NextFunction, Request, Response } from "express";
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";
import { UnauthorizedError } from "../common/errors";
import { getJwksUri } from "../services/auth.service";

declare module "express-serve-static-core" {
  interface Request {
    /** Set by requireToken. Present on every route mounted behind it. */
    token?: JWTPayload;
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
    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return next(error);
    }

    console.warn("Token verification failed:", error);
    next(new UnauthorizedError("Invalid token."));
  }
}

export default requireToken;
