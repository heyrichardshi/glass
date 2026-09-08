import { z } from "zod";

/** Distinguishes "no Glass account for this identity" from any other 403. */
export const NO_ACCOUNT_ERROR_CODE = "NO_ACCOUNT" as const;

export const ApiErrorSchema = z.object({
  message: z.string(),
  code: z.string().optional(),
});
export type ApiError = z.infer<typeof ApiErrorSchema>;
