import { z } from "zod";
import { Request, Response, NextFunction } from "express";
import { InvalidInputWithCustomMessageError } from "../common/errors";

export const validateRequest = <T>(schema: z.ZodSchema<T>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.body);
      // Mutate existing req.body as it only has a getter.
      const target = (req.body || {}) as Record<string, unknown>;
      const source = validated as unknown as Record<string, unknown>;
      Object.keys(target).forEach((key) => delete target[key]);
      Object.assign(target, source);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.issues
          .map(
            (issue: z.ZodIssue) => `${issue.path.join(".")}: ${issue.message}`,
          )
          .join(", ");
        throw new InvalidInputWithCustomMessageError(errorMessage);
      }
      next(error as any);
    }
  };
};

export const validateQuery = <T>(schema: z.ZodSchema<T>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.query);
      // Mutate existing req.query as it only has a getter.
      const target = (req.query || {}) as Record<string, unknown>;
      const source = validated as unknown as Record<string, unknown>;
      Object.keys(target).forEach((key) => delete target[key]);
      Object.assign(target, source);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.issues
          .map(
            (issue: z.ZodIssue) => `${issue.path.join(".")}: ${issue.message}`,
          )
          .join(", ");
        throw new InvalidInputWithCustomMessageError(errorMessage);
      }
      next(error as any);
    }
  };
};

export const validateParams = <T>(schema: z.ZodSchema<T>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.params);
      // Mutate existing req.params as it only has a getter.
      const target = (req.params || {}) as Record<string, unknown>;
      const source = validated as unknown as Record<string, unknown>;
      Object.keys(target).forEach((key) => delete target[key]);
      Object.assign(target, source);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.issues
          .map(
            (issue: z.ZodIssue) => `${issue.path.join(".")}: ${issue.message}`,
          )
          .join(", ");
        throw new InvalidInputWithCustomMessageError(errorMessage);
      }
      next(error as any);
    }
  };
};

/**
 * Validates the response data against the provided Zod schema to prevent extraneous data leakage.
 */
export const validateResponse = <T>(schema: z.ZodSchema<T>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Store the original res.json method used to send response
    const originalJson = res.json;

    res.json = function (data: unknown) {
      // Express res.send(object) calls res.json. Error responses must not be
      // checked against the success schema — that turns a 403 into a 500 and
      // the client never sees the original status or body.
      if (res.statusCode >= 400) {
        return originalJson.call(this, data);
      }

      try {
        // By parsing the response data, we ensure that only the fields that are defined in the schema are returned.
        const validated = schema.parse(data);

        return originalJson.call(this, validated);
      } catch (error) {
        if (error instanceof z.ZodError) {
          console.error("Response validation failed due to zod:", error.issues);
        } else {
          console.error("Response validation failed:", error);
        }

        throw new Error("Response validation failed");
      }
    };

    next();
  };
};
