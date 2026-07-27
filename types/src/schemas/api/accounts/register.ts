import { z } from "zod";

/**
 * The token a client needs to start the provider's account connection flow (for example, a Plaid
 * Link token).
 */
export const ConnectionTokenResponseSchema = z.object({
  connectionToken: z.string(),
});
export type ConnectionTokenResponse = z.infer<
  typeof ConnectionTokenResponseSchema
>;

export const RegisterAccountsBodySchema = z.object({
  /** The token the provider's connection flow returned, exchanged server-side for credentials. */
  exchangeToken: z.string(),
});
export type RegisterAccountsBody = z.infer<typeof RegisterAccountsBodySchema>;

export const RegisterAccountsResponseSchema = z.object({
  accountsRegisteredCount: z.number(),
});
export type RegisterAccountsResponse = z.infer<
  typeof RegisterAccountsResponseSchema
>;
