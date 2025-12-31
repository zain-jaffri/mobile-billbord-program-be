import { Request, Response, NextFunction } from "express";

export type RequestWithUser = Request & { user?: { username: string } };

// Lightweight user context from headers (swap for real auth later).
export const requestContext = (req: RequestWithUser, _res: Response, next: NextFunction) => {
  const username = req.header("x-user");
  if (username) {
    req.user = { username };
  }
  next();
};
