import { Request, Response, NextFunction } from "express";
import { forbidden } from "../errors";
import type { RequestWithUser } from "./requestContext";

export const requireRole = (roles: Array<"driver" | "fieldWorker" | "admin">) => {
  return (req: RequestWithUser, _res: Response, next: NextFunction) => {
    const role = req.user?.role ?? null;
    if (!role || !roles.includes(role)) {
      return next(forbidden("Insufficient permissions"));
    }
    return next();
  };
};
