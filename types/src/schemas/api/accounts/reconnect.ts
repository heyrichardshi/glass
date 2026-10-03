import { z } from "zod";

export const ReconnectAccountParamsSchema = z.object({
  accountId: z.string(),
});
export type ReconnectAccountParams = z.infer<
  typeof ReconnectAccountParamsSchema
>;
