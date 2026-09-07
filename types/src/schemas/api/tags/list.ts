import { z } from "zod";
import { TagSchema } from "../../models";

export const ListTagsResponseSchema = z.object({
  tags: z.array(TagSchema),
});
export type ListTagsResponse = z.infer<typeof ListTagsResponseSchema>;
