import type {
  AuthConfigResponse,
  ExchangeTokenResponse,
} from "@glass/types/schemas";

const VERIFIER_KEY = "glass.pkceVerifier";
const STATE_KEY = "glass.oauthState";
const RETURN_KEY = "glass.returnTo";
const ATTEMPTED_AT_KEY = "glass.loginAttemptedAt";

// This is the maximum time after which a login can be retried to prevent redirect loops.
const RETRY_AFTER_MS = 10_000;

function base64url(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((byte) => (binary += String.fromCharCode(byte)));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function randomString(byteLength: number): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return base64url(bytes);
}

async function challengeFor(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(verifier),
  );
  return base64url(new Uint8Array(digest));
}

/**
 * Authorization code flow with PKCE, with the code exchanged by the API.
 */
export function useAuth() {
  const { apiBase } = useApiBase();

  const token = useState<string | null>("glass:token", () => null);
  const isAuthenticated = computed(() => token.value !== null);

  // Set when signing in again cannot help.
  const authError = useState<string | null>("glass:authError", () => null);

  /** False when a login just happened, meaning another one is pointless. */
  function shouldRetryLogin(): boolean {
    const attemptedAt = Number(sessionStorage.getItem(ATTEMPTED_AT_KEY) ?? 0);
    return Date.now() - attemptedAt > RETRY_AFTER_MS;
  }

  // Must match OIDC_REDIRECT_URIS on the server and the URI registered in tsidp.
  function redirectUri(): string {
    return `${window.location.origin}/auth/callback`;
  }

  async function login(): Promise<void> {
    authError.value = null;

    // Recorded before the redirect, since the page is about to be replaced.
    sessionStorage.setItem(ATTEMPTED_AT_KEY, String(Date.now()));

    const config = await $fetch<AuthConfigResponse>(
      `${apiBase.value}/auth/config`,
    );

    const verifier = randomString(48);
    const state = randomString(16);

    // sessionStorage rather than memory: these have to survive the redirect to
    // tsidp and back. They are single-use and worthless without the matching
    // authorization code.
    sessionStorage.setItem(VERIFIER_KEY, verifier);
    sessionStorage.setItem(STATE_KEY, state);
    sessionStorage.setItem(
      RETURN_KEY,
      window.location.pathname + window.location.search,
    );

    const url = new URL(config.authorizationEndpoint);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("client_id", config.clientId);
    url.searchParams.set("redirect_uri", redirectUri());
    url.searchParams.set("scope", config.scope);
    url.searchParams.set("state", state);
    url.searchParams.set("code_challenge", await challengeFor(verifier));
    url.searchParams.set("code_challenge_method", "S256");

    window.location.assign(url.toString());
  }

  /** Returns the path to send the user back to. */
  async function completeLogin(
    code: string,
    returnedState: string,
  ): Promise<string> {
    const expectedState = sessionStorage.getItem(STATE_KEY);
    const verifier = sessionStorage.getItem(VERIFIER_KEY);
    const returnTo = sessionStorage.getItem(RETURN_KEY) ?? "/";

    // Cleared before use, so a failed attempt cannot be retried with the same
    // verifier and a fresh code.
    sessionStorage.removeItem(STATE_KEY);
    sessionStorage.removeItem(VERIFIER_KEY);
    sessionStorage.removeItem(RETURN_KEY);

    // Without this check a third party could hand the browser a callback URL
    // carrying their own authorization code and log you into their account.
    if (!expectedState || expectedState !== returnedState) {
      throw new Error("Authorization state did not match.");
    }
    if (!verifier) {
      throw new Error("No PKCE verifier for this login attempt.");
    }

    const exchanged = await $fetch<ExchangeTokenResponse>(
      `${apiBase.value}/auth/token`,
      {
        method: "POST",
        body: { code, codeVerifier: verifier, redirectUri: redirectUri() },
      },
    );

    token.value = exchanged.idToken;
    return returnTo;
  }

  function logout(): void {
    token.value = null;
  }

  return {
    token,
    isAuthenticated,
    authError,
    shouldRetryLogin,
    login,
    completeLogin,
    logout,
  };
}
