import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors";

// Global error handler: converts AppError to JSON, hides internal errors.
export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[error]", {
    requestId: res.locals.requestId,
    message: err.message,
    stack: err.stack,
  });
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      details: err.details ?? undefined,
    });
  }

  return res.status(500).json({
    error: "Internal server error",
  });
};
