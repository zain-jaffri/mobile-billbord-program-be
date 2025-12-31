import { Request, Response, NextFunction } from "express";

export type RequestWithUser = Request & { user?: { username: string; uid?: string; email?: string } };

// Lightweight user context from headers (swap for real auth later).
export const requestContext = (req: RequestWithUser, _res: Response, next: NextFunction) => {
  // Only set from header when auth middleware hasn't populated a user.
  if (req.user) {
    return next();
  }
  const username = req.header("x-user");
  if (username) {
    req.user = { username };
  }
  next();
};
