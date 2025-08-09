import { z } from 'zod';

export const MerchantSchema = z.object({
  id: z.string(),
  name: z.string(),
  defaultCategoryId: z.string(),
  descriptionMatchers: z.array(z.string()),
});

export type Merchant = z.infer<typeof MerchantSchema>; 