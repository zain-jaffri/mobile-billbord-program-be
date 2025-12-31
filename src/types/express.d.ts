import "express-serve-static-core";

declare module "express-serve-static-core" {
  interface Request {
    user?: {
      username: string;
      uid?: string;
      email?: string;
    };
  }
}

export {};
