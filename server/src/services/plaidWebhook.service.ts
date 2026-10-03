import { createHash, timingSafeEqual } from "node:crypto";
import { getJose, type Jose } from "../common/jose";
import { getWebhookVerificationKey } from "./plaid.service";

const SIGNING_ALGORITHM = "ES256";
const MAX_TOKEN_AGE = "5 min";

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
