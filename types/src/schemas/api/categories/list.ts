import { z } from "zod";
import { CategorySchema } from "../../models";

export const ListCategoriesResponseSchema = z.object({
  categories: z.array(CategorySchema),
});
export type ListCategoriesResponse = z.infer<
  typeof ListCategoriesResponseSchema
>;
