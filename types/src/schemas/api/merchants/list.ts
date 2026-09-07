import { z } from "zod";
import { MerchantSchema } from "../../models";

export const ListMerchantsResponseSchema = z.object({
  merchants: z.array(MerchantSchema),
});
export type ListMerchantsResponse = z.infer<typeof ListMerchantsResponseSchema>;
