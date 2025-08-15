import { z } from "zod";
import { CategorySchema } from "../../models";

export const ListCategoriesQuerySchema = z.object({
  userId: z.string(),
});
export type ListCategoriesQuery = z.infer<typeof ListCategoriesQuerySchema>;

export const ListCategoriesResponseSchema = z.object({
  categories: z.array(CategorySchema),
});
export type ListCategoriesResponse = z.infer<
  typeof ListCategoriesResponseSchema
>;
