import { z } from "zod";
import { CategorySchema } from "../../models";

export const CreateCategoryBodySchema = z.object({
  userId: z.string(),
  name: z.string(),
  parentId: z.string().optional(),
});
export type CreateCategoryBody = z.infer<typeof CreateCategoryBodySchema>;

export const CreateCategoryResponseSchema = z.object({
  category: CategorySchema,
});
export type CreateCategoryResponse = z.infer<
  typeof CreateCategoryResponseSchema
>;
