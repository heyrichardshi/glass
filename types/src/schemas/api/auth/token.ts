import { z } from "zod";

export const ExchangeTokenBodySchema = z.object({
  code: z.string().min(1),
  codeVerifier: z.string().min(1),
  redirectUri: z.string().min(1),
});
export type ExchangeTokenBody = z.infer<typeof ExchangeTokenBodySchema>;

export const ExchangeTokenResponseSchema = z.object({
  idToken: z.string(),
});
export type ExchangeTokenResponse = z.infer<typeof ExchangeTokenResponseSchema>;
