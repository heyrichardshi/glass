import { z } from "zod";

export const AccountSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  institution: z.string(),
  balance: z.string(),
  mask: z.string(),
  officialName: z.string(),
  transactionsLastRefreshedAt: z.string(),
  type: z.string(),
  status: z.enum(["open", "closed", "disconnected"]),
});

export type Account = z.infer<typeof AccountSchema>;
