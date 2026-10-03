import {
  AuthConfigResponse,
  ExchangeTokenBody,
  ExchangeTokenResponse,
} from "@glass/types/schemas";
import {
  ForbiddenError,
  InvalidInputWithCustomMessageError,
} from "../common/errors";
import { getJose, type Jose } from "../common/jose";
import { childLogger } from "../common/logger";
import { UserIdentity } from "../models";
import { issueSessionToken } from "./session.service";

const log = childLogger("auth.service");

function env(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set; the token exchange cannot run.`);
  }
  return value;
}

function isAllowedRedirectUri(candidate: string): boolean {
  return env("OIDC_REDIRECT_URIS")
    .split(",")
    .map((uri) => uri.trim())
    .filter(Boolean)
    .includes(candidate);
}

interface Discovery {
  authorization_endpoint: string;
  token_endpoint: string;
  jwks_uri: string;
}

let discovery: Promise<Discovery> | undefined;

async function getDiscovery(): Promise<Discovery> {
  if (!discovery) {
    const issuer = env("OIDC_ISSUER");

    discovery = (async () => {
      const response = await fetch(
        `${issuer}/.well-known/openid-configuration`,
      );
      if (!response.ok) {
        throw new Error(`OIDC discovery failed with ${response.status}.`);
      }

      const document = (await response.json()) as Partial<Discovery>;
      if (
        !document.authorization_endpoint ||
        !document.token_endpoint ||
        !document.jwks_uri
      ) {
        throw new Error("OIDC discovery document is missing endpoints.");
      }

      return document as Discovery;
    })().catch((error) => {
      // A rejected promise left in place would poison every later request, so a
      // transient failure here must not be cached.
      discovery = undefined;
      throw error;
    });
  }

  return discovery;
}

// Scopes requested at /authorize. tsidp advertises exactly these three.
const SCOPE = "openid email profile";

let jwks: ReturnType<Jose["createRemoteJWKSet"]> | undefined;

async function getJwks() {
  if (!jwks) {
    const { createRemoteJWKSet } = await getJose();
    jwks = createRemoteJWKSet(new URL((await getDiscovery()).jwks_uri));
  }
  return jwks;
}

async function verifyIdToken(idToken: string): Promise<UserIdentity> {
  // jose checks the signature against the JWKS and enforces exp and nbf;
  // issuer and audience are checked here so a token minted by another
  // provider, or for another client, is rejected even though it verifies.
  const { jwtVerify } = await getJose();
  const { payload } = await jwtVerify(idToken, await getJwks(), {
    issuer: env("OIDC_ISSUER"),
    audience: env("OIDC_AUDIENCE"),
  });

  if (!payload.iss || !payload.sub) {
    throw new Error("ID token is missing an identity.");
  }
  return { issuer: payload.iss, subject: payload.sub };
}

export async function getAuthConfig(): Promise<AuthConfigResponse> {
  return {
    authorizationEndpoint: (await getDiscovery()).authorization_endpoint,
    clientId: env("OIDC_CLIENT_ID"),
    scope: SCOPE,
  };
}

export async function exchangeAuthorizationCode(
  request: ExchangeTokenBody,
): Promise<ExchangeTokenResponse> {
  if (!isAllowedRedirectUri(request.redirectUri)) {
    throw new ForbiddenError("redirect_uri is not allowed.");
  }

  const response = await fetch((await getDiscovery()).token_endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code: request.code,
      redirect_uri: request.redirectUri,
      code_verifier: request.codeVerifier,
      client_id: env("OIDC_CLIENT_ID"),
      client_secret: env("OIDC_CLIENT_SECRET"),
    }),
  });

  if (!response.ok) {
    log.error({ status: response.status }, "token exchange rejected");
    throw new InvalidInputWithCustomMessageError(
      "Authorization code could not be exchanged.",
    );
  }

  // The access token in this response is opaque and unusable to us.
  // The ID token is the JWT the API can verify.
  const token = (await response.json()) as { id_token?: string };

  if (!token.id_token) {
    throw new Error(
      "Token response has no id_token. Check that the authorization request " +
        "included the openid scope.",
    );
  }

  const identity = await verifyIdToken(token.id_token);
  return { sessionToken: await issueSessionToken(identity) };
}
