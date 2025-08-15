import { z } from "zod";
import { MerchantSchema } from "../../models";

export const UpdateMerchantParamsSchema = z.object({
  merchantId: z.string(),
});
export type UpdateMerchantParams = z.infer<typeof UpdateMerchantParamsSchema>;

export const UpdateMerchantBodySchema = z.object({
  householdId: z.string(),
  name: z.string().optional(),
  defaultCategoryId: z.string().optional(),
  descriptionMatchers: z.array(z.string()).optional(),
});
export type UpdateMerchantBody = z.infer<typeof UpdateMerchantBodySchema>;

export const UpdateMerchantResponseSchema = z.object({
  merchant: MerchantSchema,
});
export type UpdateMerchantResponse = z.infer<
  typeof UpdateMerchantResponseSchema
>;
