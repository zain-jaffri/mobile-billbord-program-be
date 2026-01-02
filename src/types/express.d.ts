import "express-serve-static-core";

declare module "express-serve-static-core" {
  interface Request {
    user?: {
      username: string;
      uid?: string;
      email?: string;
      role?: "driver" | "fieldWorker" | "admin" | null;
      driverId?: number | null;
    };
  }
}

export {};
