import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { ValidateError } from "tsoa";

/**
 * Global Error Handler Middleware
 * Catches all unhandled errors and returns a consistent JSON response.
 * Must be registered LAST in the Express middleware chain.
 */
export function errorMiddleware(err: unknown, req: Request, res: Response, next: NextFunction): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: "Validation error",
      details: err.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
    return;
  }

  if (err instanceof ValidateError) {
    res.status(400).json({
      success: false,
      message: "Validation Failed",
      details: err.fields,
    });
    return;
  }

  const error = err as Error;
  console.error(`❌ [Error] ${error.message}`);
  console.error(error.stack);

  res.status(500).json({
    success: false,
    message: "Internal server error",
    ...(process.env.NODE_ENV !== "production" && { error: error.message }),
  });
}
