import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { env } from "../config/env";
import { logger } from "../helpers/logger";
import { sendError } from "../helpers/response";
import { AppError, NotFoundError } from "../helpers/errors";
export { AppError } from "../helpers/errors";

const isMongoServerError = (err: unknown): boolean => {
  const error = err as { name?: string; constructor?: { name?: string }; message?: string };
  return (
    error.name === "MongoServerError" ||
    error.constructor?.name === "MongoServerError" ||
    (typeof error.message === "string" && error.message.includes("MongoServerError"))
  );
};

const handleMongooseError = (err: unknown): AppError => {
  if (err instanceof mongoose.Error.ValidationError) {
    const messages = Object.values(err.errors).map((e) => e.message);
    return new AppError(messages.join(", "), 400, true, "MONGOOSE_VALIDATION_ERROR");
  }

  if (err instanceof mongoose.Error.CastError) {
    return new AppError(`Invalid ${err.path}: ${err.value}`, 400, true, "INVALID_OBJECT_ID");
  }

  const error = err as { code?: number; keyPattern?: Record<string, unknown>; message?: string };

  if (error.code === 11000) {
    const field = error.keyPattern ? Object.keys(error.keyPattern)[0] : "resource";
    return new AppError(`${field} already exists`, 409, true, "DUPLICATE_KEY");
  }

  if (isMongoServerError(err)) {
    return new AppError(
      error.message || "Database operation failed",
      400,
      true,
      "MONGO_SERVER_ERROR",
    );
  }

  return new AppError("Database error", 500, false, "DATABASE_ERROR");
};

const logError = (err: AppError, req: Request): void => {
  const payload = {
    message: err.message,
    code: err.code,
    statusCode: err.statusCode,
    isOperational: err.isOperational,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
  };

  if (err.isOperational) {
    logger.warn(payload);
    return;
  }

  logger.error(payload);
};

export const notFound = (_req: Request, _res: Response, next: NextFunction): void => {
  next(new NotFoundError("Route not found", "ROUTE_NOT_FOUND"));
};

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (res.headersSent) {
    next(err);
    return;
  }

  const appError = err instanceof AppError ? err : handleMongooseError(err);
  logError(appError, req);

  const message =
    !appError.isOperational && env.NODE_ENV === "production"
      ? "Internal server error"
      : appError.message;
  const meta =
    env.NODE_ENV === "production"
      ? appError.code
        ? { code: appError.code }
        : undefined
      : {
          code: appError.code,
          stack: appError.stack,
        };

  sendError(res, message, appError.statusCode, meta);
};
