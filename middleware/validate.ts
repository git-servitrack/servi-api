import { NextFunction, Request, RequestHandler, Response } from "express";
import { AnyZodObject, ZodError } from "zod";
import { BadRequestError } from "../helpers/errors";

const formatZodError = (error: ZodError): string => {
  return error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join(", ");
};

export const validate = (schema: AnyZodObject): RequestHandler => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    if (!result.success) {
      next(new BadRequestError(`Validation failed: ${formatZodError(result.error)}`, "VALIDATION_ERROR"));
      return;
    }

    req.body = result.data.body;
    req.params = result.data.params as Request["params"];
    req.query = result.data.query as Request["query"];
    next();
  };
};
