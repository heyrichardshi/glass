import { getJose } from "../common/jose";
import { UserIdentity } from "../models";

const SESSION_ISSUER = "glass";
const SESSION_AUDIENCE = "glass-api";
const SESSION_LIFETIME = "12h";

const IDENTITY_ISSUER_CLAIM = "idp";

function secret(): Uint8Array {
  const value = process.env.SESSION_SECRET;
  if (!value) {
    throw new Error("SESSION_SECRET is not set; sessions cannot be signed.");
  }
  return new TextEncoder().encode(value);
}

/**
 * Signs a Glass session token for an identity already verified at the identity provider.
 */
export async function issueSessionToken(
  identity: UserIdentity,
): Promise<string> {
  const { SignJWT } = await getJose();
  return new SignJWT({ [IDENTITY_ISSUER_CLAIM]: identity.issuer })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(identity.subject)
    .setIssuer(SESSION_ISSUER)
    .setAudience(SESSION_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(SESSION_LIFETIME)
    .sign(secret());
}

/**
 * Verifies a Glass session token and returns the identity it carries. Throws on any failure.
 */
export async function verifySessionToken(token: string): Promise<UserIdentity> {
  const { jwtVerify } = await getJose();

  const { payload } = await jwtVerify(token, secret(), {
    issuer: SESSION_ISSUER,
    audience: SESSION_AUDIENCE,
    algorithms: ["HS256"],
  });

  const issuer = payload[IDENTITY_ISSUER_CLAIM];
  if (typeof issuer !== "string" || !issuer || !payload.sub) {
    throw new Error("Session token is missing an identity.");
  }
  return { issuer, subject: payload.sub };
}
