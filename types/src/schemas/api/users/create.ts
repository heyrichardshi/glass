import { z } from "zod";
import { UserSchema } from "../../models";

export const CreateUserBodySchema = z.object({
  name: z.string().trim().min(1).max(100),
});
export type CreateUserBody = z.infer<typeof CreateUserBodySchema>;

export const CreateUserResponseSchema = z.object({
  user: UserSchema,
});
export type CreateUserResponse = z.infer<typeof CreateUserResponseSchema>;
