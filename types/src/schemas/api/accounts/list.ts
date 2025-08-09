import { z } from 'zod';
import { AccountSchema } from '../../models';

export const ListAccountsQuerySchema = z.object({
  userId: z.string(),
});
export type ListAccountsQuery = z.infer<typeof ListAccountsQuerySchema>;

export const ListAccountsResponseSchema = z.object({
  accounts: z.array(AccountSchema),
});
export type ListAccountsResponse = z.infer<typeof ListAccountsResponseSchema>; 