import { z } from "zod";

// What the client needs to start an authorization request.
export const AuthConfigResponseSchema = z.object({
  authorizationEndpoint: z.string(),
  clientId: z.string(),
  scope: z.string(),
});
export type AuthConfigResponse = z.infer<typeof AuthConfigResponseSchema>;
