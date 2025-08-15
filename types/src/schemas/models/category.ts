import { z } from "zod";

export const CategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  parentId: z.string().optional(),
  fullPath: z.array(z.string()),
  isDefault: z.boolean().optional(),
});

export type Category = z.infer<typeof CategorySchema>;
