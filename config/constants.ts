export const config = {
  APP_NAME: "SERVI-API",
  MESSAGE: {
    WELCOME: "SERVI-API is running",
  },
};

export const httpStatus = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export const userRoles = [
  "warehouse_staff",
  "admin",
  "head_technician",
  "technician",
  "project_site_staff",
  "management",
] as const;

export type UserRole = (typeof userRoles)[number];
