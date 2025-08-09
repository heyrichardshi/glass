import { z } from 'zod';
import { TagSchema } from '../../models';

export const CreateTagBodySchema = z.object({
  userId: z.string(),
  name: z.string(),
});
export type CreateTagBody = z.infer<typeof CreateTagBodySchema>;

export const CreateTagResponseSchema = z.object({
  tag: TagSchema,
});
export type CreateTagResponse = z.infer<typeof CreateTagResponseSchema>; 