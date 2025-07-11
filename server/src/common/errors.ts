export class TellerAccountDisconnectedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TellerAccountDisconnectedError";
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ForbiddenError";
  }
}

export class ConflictError extends Error {
  constructor(
    entityType: "Category" | "Tag" | "Merchant",
    resourceName: string,
  ) {
    super(`${entityType} with name '${resourceName}' already exists.`);
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
