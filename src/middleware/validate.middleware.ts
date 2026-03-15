import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

/**
 * Zod Validation Middleware (Factory)
 * Validates req.body against the provided Zod schema.
 * Returns 400 with detailed errors if validation fails.
 */
export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error: any) {
      if (error instanceof ZodError) {
        const formattedErrors = error.issues.map((issue: any) => ({
          field: issue.path.join("."),
          message: issue.message,
        }));
        res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: formattedErrors,
        });
        return;
      }
      next(error);
    }
  };
}
