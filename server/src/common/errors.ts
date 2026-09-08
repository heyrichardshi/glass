export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

export class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  readonly code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = "ForbiddenError";
    this.code = code;
  }
}

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConflictError";
  }
}

export class DatabaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DatabaseError";
  }
}

export class InvalidInputError extends Error {
  constructor(missingParam: string) {
    super(`Invalid input: missing parameter '${missingParam}'.`);
    this.name = "InvalidInputError";
  }
}

export class InvalidInputWithCustomMessageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidInputWithCustomMessageError";
  }
}
