import {
  ConflictError,
  DatabaseError,
  ForbiddenError,
  InvalidInputError,
  InvalidInputWithCustomMessageError,
  NotFoundError,
  UnauthorizedError,
} from "../common/errors";
import { Request, Response, NextFunction } from "express";

const errorHandler = (
  error: unknown,
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  if (
    error instanceof InvalidInputError ||
    error instanceof InvalidInputWithCustomMessageError
  ) {
    return response.status(400).send({ message: error.message });
  } else if (error instanceof UnauthorizedError) {
    return response.status(401).send({ message: error.message });
  } else if (error instanceof NotFoundError) {
    return response.status(404).send({ message: error.message });
  } else if (error instanceof ConflictError) {
    return response.status(409).send({ message: error.message });
  } else if (error instanceof ForbiddenError) {
    const body: { message: string; code?: string } = {
      message: error.message,
    };
    if (error.code) {
      body.code = error.code;
    }
    return response.status(403).send(body);
  } else if (error instanceof DatabaseError) {
    return response.status(500).send({ message: error.message });
  }

  // Capture all other cases
  const { method, url, path, query, params } = request;
  console.error(
    `An unknown error occurred for request ${JSON.stringify({ method, url, path, query, params })}:`,
    error,
  );
  response.status(500).send("An unknown error occurred.");
};

export default errorHandler;
