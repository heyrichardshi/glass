import { z } from "zod";
import { AccountSchema } from "../../models";

export const ListAccountsResponseSchema = z.object({
  accounts: z.array(AccountSchema),
});
export type ListAccountsResponse = z.infer<typeof ListAccountsResponseSchema>;
