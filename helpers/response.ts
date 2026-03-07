import { Response } from "express";
import { ApiResponse } from "../types/common";

export const sendSuccess = <T>(
  res: Response,
  message: string,
  data: T | null = null,
  statusCode = 200,
  meta?: Record<string, unknown>,
): Response<ApiResponse<T>> => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    ...(meta ? { meta } : {}),
  });
};

export const sendError = (
  res: Response,
  message: string,
  statusCode = 500,
  meta?: Record<string, unknown>,
): Response<ApiResponse<null>> => {
  return res.status(statusCode).json({
    success: false,
    message,
    data: null,
    ...(meta ? { meta } : {}),
  });
};
