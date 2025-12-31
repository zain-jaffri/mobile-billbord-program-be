import { AnyZodObject } from "zod";
import { Request, Response, NextFunction } from "express";
import { badRequest } from "../errors";

// Validates req body/params/query with a Zod schema and normalizes types.
export const validate = (schema: AnyZodObject) => (req: Request, _res: Response, next: NextFunction) => {
  const result = schema.safeParse({
    body: req.body,
    params: req.params,
    query: req.query,
  });

  if (!result.success) {
    // Flatten Zod errors into a simple list for API clients.
    const issues = result.error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    }));
    return next(badRequest("Validation failed", { issues }));
  }

  req.body = result.data.body;
  req.params = result.data.params;
  req.query = result.data.query;
  return next();
};
