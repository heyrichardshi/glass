import type {
  ConnectionTokenResponse,
  RegisterAccountsResponse,
} from "@glass/types/schemas";

// Plaid Link is loaded from the CDN (see nuxt.config app.head).
declare global {
  const Plaid: {
    create: (config: any) => { open: () => void; exit: () => void };
  };
}

// localStorage, because an OAuth bank returns the browser to /plaid/oauth as a fresh page load.
const LINK_TOKEN_KEY = "glass.plaidLinkToken";

// Save the pending key in case re-auth happens in the middle of a registration.
const PENDING_PUBLIC_TOKEN_KEY = "glass.plaidPendingPublicToken";
const PUBLIC_TOKEN_TTL_MS = 30 * 60 * 1000;

interface PendingPublicToken {
  publicToken: string;
  issuedAt: number;
}

let retryingPending = false;

function readPendingPublicToken(): PendingPublicToken | undefined {
  const raw = localStorage.getItem(PENDING_PUBLIC_TOKEN_KEY);
  if (!raw) return undefined;

  let pending: PendingPublicToken | undefined;
  try {
    pending = JSON.parse(raw) as PendingPublicToken;
  } catch {
    pending = undefined;
  }

  if (pending && Date.now() - pending.issuedAt < PUBLIC_TOKEN_TTL_MS) {
    return pending;
  }

  console.error(
    "PLAID_LINK_RECOVERY pending public token expired before registration",
    { raw },
  );
  localStorage.removeItem(PENDING_PUBLIC_TOKEN_KEY);
  return undefined;
}

/**
 * Opens Plaid Link and registers the resulting Item. `onFinished` runs once Link closes,
 * whether it succeeded, failed or was exited.
 */
export function usePlaidLink(
  options: { onConnected?: () => void; onFinished?: () => void } = {},
) {
  const { apiBase } = useApiBase();
  const toast = useToast();

  /** Waits briefly for the Plaid Link script to become available. */
  async function waitForPlaid(): Promise<boolean> {
    for (let i = 0; i < 20 && typeof Plaid === "undefined"; i++) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    return typeof Plaid !== "undefined";
  }

  async function start(): Promise<void> {
    const { connectionToken } = await $fetch<ConnectionTokenResponse>(
      `${apiBase.value}/accounts/register/token`,
      { method: "POST" },
    );
    localStorage.setItem(LINK_TOKEN_KEY, connectionToken);
    open(connectionToken);
  }

  /** Re-opens Link after an OAuth bank redirects back. False when no Link session is pending. */
  function resume(receivedRedirectUri: string): boolean {
    const token = localStorage.getItem(LINK_TOKEN_KEY);
    if (!token) return false;
    open(token, receivedRedirectUri);
    return true;
  }

  function open(token: string, receivedRedirectUri?: string): void {
    const handler = Plaid.create({
      token,
      ...(receivedRedirectUri ? { receivedRedirectUri } : {}),
      onSuccess: async (publicToken: string, metadata: any) => {
        localStorage.removeItem(LINK_TOKEN_KEY);
        const pending: PendingPublicToken = {
          publicToken,
          issuedAt: Date.now(),
        };
        localStorage.setItem(PENDING_PUBLIC_TOKEN_KEY, JSON.stringify(pending));
        console.warn("PLAID_LINK_RECOVERY public token issued", {
          publicToken,
          institution: metadata?.institution,
          accounts: metadata?.accounts,
          linkSessionId: metadata?.link_session_id,
        });
        await exchange(publicToken);
        options.onFinished?.();
      },
      onExit: (err: unknown) => {
        localStorage.removeItem(LINK_TOKEN_KEY);
        if (err) console.error("Plaid Link exited with error:", err);
        options.onFinished?.();
      },
    });
    handler.open();
  }

  async function exchange(publicToken: string): Promise<void> {
    try {
      const res = await $fetch<RegisterAccountsResponse>(
        `${apiBase.value}/accounts/register`,
        { method: "POST", body: { exchangeToken: publicToken } },
      );
      localStorage.removeItem(PENDING_PUBLIC_TOKEN_KEY);
      console.warn("PLAID_LINK_RECOVERY registered item", {
        accountsRegisteredCount: res.accountsRegisteredCount,
      });
      toast.add({
        title: `Successfully added ${res.accountsRegisteredCount} account(s)`,
        color: "success",
      });
      options.onConnected?.();
    } catch (err: any) {
      const status: number | undefined = err?.statusCode;
      const retryable = status === undefined || status === 401;
      if (!retryable) localStorage.removeItem(PENDING_PUBLIC_TOKEN_KEY);

      console.error("PLAID_LINK_RECOVERY registration request failed", {
        publicToken,
        status,
        message: err?.message,
        retryable,
      });
      toast.add(
        retryable
          ? {
              title: "Bank connected, not yet registered",
              description:
                "Glass will retry once you are signed in. If nothing happens, reload within 30 minutes.",
              color: "warning",
            }
          : {
              title: "Something went wrong",
              description: `Error adding accounts: ${err.message}`,
              color: "error",
            },
      );
    }
  }

  async function retryPendingRegistration(): Promise<void> {
    if (retryingPending) return;
    const pending = readPendingPublicToken();
    if (!pending) return;

    retryingPending = true;
    try {
      console.warn("PLAID_LINK_RECOVERY retrying registration", pending);
      await exchange(pending.publicToken);
    } finally {
      retryingPending = false;
    }
  }

  return { waitForPlaid, start, resume, retryPendingRegistration };
}
