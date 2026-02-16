import { type NextFunction, type Request, type Response } from "express";
import { ZodError } from "zod";

import { captureError } from "../config/sentry.js";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { HttpError } from "../utils/http-error.js";

interface ErrorResponse {
  message: string;
  stack?: string | undefined;
}

export function errorMiddleware(
  err: Error,
  req: Request,
  res: Response<ErrorResponse>,
  _next: NextFunction,
) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      message: err.issues.map((issue) => issue.message).join(", "),
      stack: env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }

  if (err instanceof HttpError) {
    logger.warn("Http error", {
      message: err.message,
      statusCode: err.statusCode,
      path: req.path,
      method: req.method,
    });
    return res.status(err.statusCode).json({
      message: err.message,
      stack: env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }

  logger.error("Unhandled error", {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });
  captureError(err, {
    path: req.path,
    method: req.method,
  });

  return res.status(500).json({
    message: "Error intern del servidor",
    stack: env.NODE_ENV === "development" ? err.stack : undefined,
  });
}
