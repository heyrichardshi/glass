import { z } from "zod";

export const PlaidLinkTokenResponseSchema = z.object({
  linkToken: z.string(),
});
export type PlaidLinkTokenResponse = z.infer<
  typeof PlaidLinkTokenResponseSchema
>;

export const PlaidExchangeBodySchema = z.object({
  publicToken: z.string(),
});
export type PlaidExchangeBody = z.infer<typeof PlaidExchangeBodySchema>;

export const PlaidExchangeResponseSchema = z.object({
  accountsRegisteredCount: z.number(),
});
export type PlaidExchangeResponse = z.infer<
  typeof PlaidExchangeResponseSchema
>;
