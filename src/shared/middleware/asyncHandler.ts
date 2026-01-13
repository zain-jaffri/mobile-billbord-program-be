import { Request, Response, NextFunction, RequestHandler } from "express";

// Wrap async handlers so rejections go through Express error handling.
export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>): RequestHandler =>
  (req, res, next) => {
    void fn(req, res, next).catch(next);
  };
