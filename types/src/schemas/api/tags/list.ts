import { z } from 'zod';
import { TagSchema } from '../../models';

export const ListTagsQuerySchema = z.object({
  userId: z.string(),
});
export type ListTagsQuery = z.infer<typeof ListTagsQuerySchema>;

export const ListTagsResponseSchema = z.object({
  tags: z.array(TagSchema),
});
export type ListTagsResponse = z.infer<typeof ListTagsResponseSchema>; 