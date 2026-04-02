import { httpStatus } from "../config/constants";

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  code?: string;

  constructor(message: string, statusCode: number, isOperational = true, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Bad request", code?: string) {
    super(message, httpStatus.BAD_REQUEST, true, code);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found", code?: string) {
    super(message, httpStatus.NOT_FOUND, true, code);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflict", code?: string) {
    super(message, httpStatus.CONFLICT, true, code);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized", code?: string) {
    super(message, httpStatus.UNAUTHORIZED, true, code);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden", code?: string) {
    super(message, httpStatus.FORBIDDEN, true, code);
  }
}
