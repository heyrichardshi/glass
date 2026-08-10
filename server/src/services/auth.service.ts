import {
  ExchangeTokenBody,
  ExchangeTokenResponse,
} from "@glass/types/schemas";
import {
  ForbiddenError,
  InvalidInputWithCustomMessageError,
} from "../common/errors";

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

let tokenEndpoint: Promise<string> | undefined;

async function getTokenEndpoint(): Promise<string> {
  if (!tokenEndpoint) {
    const issuer = env("OIDC_ISSUER");

    tokenEndpoint = (async () => {
      const response = await fetch(
        `${issuer}/.well-known/openid-configuration`,
      );
      if (!response.ok) {
        throw new Error(`OIDC discovery failed with ${response.status}.`);
      }

      const document = (await response.json()) as { token_endpoint?: string };
      if (!document.token_endpoint) {
        throw new Error("OIDC discovery document has no token_endpoint.");
      }

      return document.token_endpoint;
    })().catch((error) => {
      // A rejected promise left in place would poison every later request, so a
      // transient failure here must not be cached.
      tokenEndpoint = undefined;
      throw error;
    });
  }

  return tokenEndpoint;
}

export async function exchangeAuthorizationCode(
  request: ExchangeTokenBody,
): Promise<ExchangeTokenResponse> {
  if (!isAllowedRedirectUri(request.redirectUri)) {
    throw new ForbiddenError("redirect_uri is not allowed.");
  }

  const response = await fetch(await getTokenEndpoint(), {
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
    console.error(
      `Token exchange rejected with ${response.status}:`,
      await response.text(),
    );
    throw new InvalidInputWithCustomMessageError(
      "Authorization code could not be exchanged.",
    );
  }

  const token = (await response.json()) as {
    access_token?: string;
    token_type?: string;
    expires_in?: number;
    id_token?: string;
  };

  if (!token.access_token || !token.token_type) {
    throw new Error("Token response is missing access_token or token_type.");
  }

  return {
    accessToken: token.access_token,
    tokenType: token.token_type,
    expiresIn: token.expires_in,
    idToken: token.id_token,
  };
}
