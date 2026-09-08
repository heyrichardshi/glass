import "dotenv/config";
import pino from "pino";

/**
 * Process-wide logger. Writes JSON lines to stdout.
 *
 * `LOG_LEVEL` controls verbosity (default `info`). `warn` silences per-account chatter.
 * Log identifiers and counts, never bodies, access tokens or Cosmos keys.
 */
export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  redact: [
    "accessToken",
    "*.accessToken",
    "access_token",
    "*.access_token",
    "id_token",
    "*.id_token",
    "client_secret",
    "*.client_secret",
    "COSMOS_DB_KEY",
    "authorization",
    "*.authorization",
    "req.headers.authorization",
  ],
});

export function childLogger(component: string) {
  return logger.child({ component });
}
