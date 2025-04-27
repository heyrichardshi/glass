import {
  ConflictError,
  DatabaseError,
  ForbiddenError,
  NotFoundError,
} from "../common/errors";
import { Request, Response, NextFunction } from "express";

const errorHandler = (
  error: unknown,
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  if (error instanceof NotFoundError) {
    return response.status(404).send({ message: error.message });
  } else if (error instanceof ConflictError) {
    return response.status(409).send({ message: error.message });
  } else if (error instanceof ForbiddenError) {
    return response.status(403).send({ message: error.message });
  } else if (error instanceof DatabaseError) {
    return response.status(500).send({ message: error.message });
  }

  // Capture all other cases
  console.error(
    `An unknown error occurred for request ${JSON.stringify(request)}:`,
    error,
  );
  response.status(500).send("An unknown error occurred.");
};

export default errorHandler;
