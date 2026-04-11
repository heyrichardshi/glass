import { z } from "zod";

export const ApplyAllMatchersBodySchema = z.object({
  householdId: z.string(),
  overrideExistingMerchants: z.boolean(),
  overrideExistingCategories: z.boolean(),
});
export type ApplyAllMatchersBody = z.infer<typeof ApplyAllMatchersBodySchema>;

export const ApplyAllMatchersResponseSchema = z.object({
  retaggedCount: z.number(),
});
export type ApplyAllMatchersResponse = z.infer<
  typeof ApplyAllMatchersResponseSchema
>;
