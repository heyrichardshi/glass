import { z } from "zod";
import { UserSchema } from "../../models";

export const AttachIdentityParamsSchema = z.object({
  userId: z.string().min(1),
});
export type AttachIdentityParams = z.infer<typeof AttachIdentityParamsSchema>;

export const AttachIdentityResponseSchema = z.object({
  user: UserSchema,
});
export type AttachIdentityResponse = z.infer<
  typeof AttachIdentityResponseSchema
>;
