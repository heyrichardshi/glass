import { z } from "zod";

export const RefreshAccountParamsSchema = z.object({
  accountId: z.string(),
});
export type RefreshAccountParams = z.infer<typeof RefreshAccountParamsSchema>;

export const RefreshAccountResponseSchema = z.undefined();
export type RefreshAccountResponse = z.infer<
  typeof RefreshAccountResponseSchema
>;
