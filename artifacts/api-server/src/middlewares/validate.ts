import type { Request, Response, NextFunction } from "express";
import { z, type ZodTypeAny } from "zod";

export function validate<T extends ZodTypeAny>(schema: T) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const issues = result.error.issues.map((i) => ({
        field: i.path.join("."),
        message: i.message,
      }));
      res.status(400).json({
        error: "VALIDATION_ERROR",
        message: "Request body validation failed",
        issues,
      });
      return;
    }
    req.body = result.data;
    next();
  };
}

export function validateQuery<T extends ZodTypeAny>(schema: T) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const issues = result.error.issues.map((i) => ({
        field: i.path.join("."),
        message: i.message,
      }));
      res.status(400).json({
        error: "VALIDATION_ERROR",
        message: "Query parameter validation failed",
        issues,
      });
      return;
    }
    req.query = result.data as typeof req.query;
    next();
  };
}
