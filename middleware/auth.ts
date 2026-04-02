import { NextFunction, Request, Response, RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { ForbiddenError, UnauthorizedError } from "../helpers/errors";
import { AuthTokenPayload } from "../types/auth";

export interface AuthenticatedRequest extends Request {
  authUser?: AuthTokenPayload;
}

// Purpose: Verify access tokens and attach authenticated user context.
export const authenticate: RequestHandler = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    next(new UnauthorizedError("Missing or invalid authorization header", "MISSING_AUTH_HEADER"));
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, env.ACCESS_TOKEN_SECRET) as AuthTokenPayload;
    (req as AuthenticatedRequest).authUser = decoded;
    next();
  } catch (_error) {
    next(new UnauthorizedError("Invalid or expired token", "INVALID_TOKEN"));
  }
};

// Purpose: Restrict endpoints to specific user roles.
export const authorize = (allowedRoles: AuthTokenPayload["role"][]): RequestHandler => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const authUser = (req as AuthenticatedRequest).authUser;

    if (!authUser) {
      next(new UnauthorizedError("Authentication required", "AUTH_REQUIRED"));
      return;
    }

    if (!allowedRoles.includes(authUser.role)) {
      next(new ForbiddenError("Insufficient role permissions", "INSUFFICIENT_ROLE"));
      return;
    }

    next();
  };
};
