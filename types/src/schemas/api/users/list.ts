import { z } from "zod";
import { UserSchema } from "../../models";

export const ListUsersResponseSchema = z.object({
  users: z.array(UserSchema),
});
export type ListUsersResponse = z.infer<typeof ListUsersResponseSchema>;
