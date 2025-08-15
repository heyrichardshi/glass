import { z } from "zod";

export const RegisterAccountsBodySchema = z.object({
  accessToken: z.string(),
});
export type RegisterAccountsBody = z.infer<typeof RegisterAccountsBodySchema>;

export const RegisterAccountsResponseSchema = z.object({
  accountsRegisteredCount: z.number(),
});
export type RegisterAccountsResponse = z.infer<
  typeof RegisterAccountsResponseSchema
>;
