import { createHash, timingSafeEqual } from "node:crypto";
import { NotFoundError } from "../common/errors";
import { getJose, type Jose } from "../common/jose";
import { childLogger } from "../common/logger";
import { getWebhookVerificationKey } from "./plaid.service";
import { syncItem } from "./sync.service";

const log = childLogger("plaidWebhook.service");

const SIGNING_ALGORITHM = "ES256";
const MAX_TOKEN_AGE = "5 min";

/**
 * Webhooks answered by syncing the Item. A sync against a broken Item fails with the error code
 * the webhook carries, which syncItem records; a sync against a repaired one clears it.
 */
const SYNC_WEBHOOKS = new Set([
  "TRANSACTIONS/SYNC_UPDATES_AVAILABLE",
  "ITEM/ERROR",
  "ITEM/LOGIN_REPAIRED",
  "ITEM/USER_PERMISSION_REVOKED",
  "ITEM/USER_ACCOUNT_REVOKED",
]);

/** Webhooks that only update-mode Link can act on. */
const UPDATE_MODE_WEBHOOKS = new Set([
  "ITEM/PENDING_DISCONNECT",
  "ITEM/NEW_ACCOUNTS_AVAILABLE",
]);

type VerificationKey = Awaited<ReturnType<Jose["importJWK"]>>;

const keyCache = new Map<string, VerificationKey>();

/** The webhook did not come from Plaid, or was altered after Plaid signed it. */
export class WebhookVerificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WebhookVerificationError";
  }
}

async function getVerificationKey(
  jose: Jose,
  keyId: string,
): Promise<VerificationKey> {
  const cached = keyCache.get(keyId);
  if (cached) {
    return cached;
  }

  const jwk = await getWebhookVerificationKey(keyId);
  if (jwk.expired_at !== null) {
    throw new WebhookVerificationError(`key ${keyId} has expired`);
  }

  const key = await jose.importJWK(
    { kty: jwk.kty, crv: jwk.crv, x: jwk.x, y: jwk.y },
    SIGNING_ALGORITHM,
  );
  keyCache.set(keyId, key);
  return key;
}

/**
 * Verifies a Plaid webhook against the JWT in its `Plaid-Verification` header: the JWT must
 * be signed by a current Plaid key, issued within the last five minutes, and carry the
 * SHA-256 of the body exactly as received.
 *
 * @throws WebhookVerificationError if the webhook fails any check. Other errors mean the
 * check could not be completed, e.g. Plaid's key endpoint was unreachable.
 */
export async function verifyPlaidWebhook(
  token: string | undefined,
  rawBody: Buffer | undefined,
): Promise<void> {
  if (!token) {
    throw new WebhookVerificationError("missing Plaid-Verification header");
  }
  if (!rawBody) {
    throw new WebhookVerificationError("missing body");
  }

  const jose = await getJose();

  let header: ReturnType<Jose["decodeProtectedHeader"]>;
  try {
    header = jose.decodeProtectedHeader(token);
  } catch {
    throw new WebhookVerificationError("malformed Plaid-Verification header");
  }
  if (header.alg !== SIGNING_ALGORITHM) {
    throw new WebhookVerificationError(`unexpected algorithm ${header.alg}`);
  }
  if (!header.kid) {
    throw new WebhookVerificationError("missing key ID");
  }

  const key = await getVerificationKey(jose, header.kid);

  let claimedHash: unknown;
  try {
    const { payload } = await jose.jwtVerify(token, key, {
      algorithms: [SIGNING_ALGORITHM],
      maxTokenAge: MAX_TOKEN_AGE,
    });
    claimedHash = payload.request_body_sha256;
  } catch (error) {
    throw new WebhookVerificationError(
      `token rejected: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  if (typeof claimedHash !== "string") {
    throw new WebhookVerificationError("missing body hash claim");
  }

  const claimed = Buffer.from(claimedHash);
  const actual = Buffer.from(
    createHash("sha256").update(rawBody).digest("hex"),
  );
  if (claimed.length !== actual.length || !timingSafeEqual(claimed, actual)) {
    throw new WebhookVerificationError("body hash mismatch");
  }
}

/**
 * @throws if the work failed and Plaid should redeliver.
 */
export async function handlePlaidWebhook(
  payload: Record<string, unknown>,
): Promise<void> {
  const webhookType = payload.webhook_type;
  const webhookCode = payload.webhook_code;
  const itemId = payload.item_id;
  const context = { webhookType, webhookCode, itemId };
  const key = `${webhookType}/${webhookCode}`;

  if (SYNC_WEBHOOKS.has(key)) {
    if (typeof itemId !== "string") {
      log.warn(context, "webhook has no item ID; ignoring");
      return;
    }
    try {
      const result = await syncItem(itemId);
      log.info({ ...context, result: result.status }, "handled webhook");
    } catch (error) {
      if (error instanceof NotFoundError) {
        log.warn(context, "webhook for an unknown item; ignoring");
        return;
      }
      throw error;
    }
    return;
  }

  if (UPDATE_MODE_WEBHOOKS.has(key)) {
    log.warn(context, "item needs update-mode Link");
    return;
  }

  log.info(context, "ignored webhook");
}
