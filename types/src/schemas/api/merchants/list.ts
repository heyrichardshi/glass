import { z } from "zod";
import { MerchantSchema } from "../../models";

export const ListMerchantsQuerySchema = z.object({
  householdId: z.string(),
});
export type ListMerchantsQuery = z.infer<typeof ListMerchantsQuerySchema>;

export const ListMerchantsResponseSchema = z.object({
  merchants: z.array(MerchantSchema),
});
export type ListMerchantsResponse = z.infer<typeof ListMerchantsResponseSchema>;
