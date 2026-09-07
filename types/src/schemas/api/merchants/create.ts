import { z } from "zod";
import { MerchantSchema } from "../../models";

export const CreateMerchantBodySchema = z.object({
  name: z.string(),
  defaultCategoryId: z.string(),
  descriptionMatchers: z.array(z.string()).optional(),
});
export type CreateMerchantBody = z.infer<typeof CreateMerchantBodySchema>;

export const CreateMerchantResponseSchema = z.object({
  merchant: MerchantSchema,
});
export type CreateMerchantResponse = z.infer<
  typeof CreateMerchantResponseSchema
>;
