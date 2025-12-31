import { createRemoteJWKSet, jwtVerify } from "jose";
import { Request, Response, NextFunction } from "express";
import { config } from "../config";
import type { RequestWithUser } from "./requestContext";
import { forbidden } from "../errors";

const jwks = createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com")
);

// Verifies Firebase ID tokens from the Authorization header.
export const authenticateFirebase = async (req: RequestWithUser, _res: Response, next: NextFunction) => {
  const authHeader = req.header("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return next(forbidden("Missing Authorization header"));
  }

  const token = authHeader.slice("Bearer ".length).trim();

  try {
    const { payload } = await jwtVerify(token, jwks, {
      issuer: `https://securetoken.google.com/${config.firebase.projectId}`,
      audience: config.firebase.projectId,
    });

    req.user = {
      username: (payload.email as string) ?? (payload.user_id as string) ?? payload.sub ?? "unknown",
      uid: (payload.user_id as string) ?? payload.sub ?? undefined,
      email: (payload.email as string) ?? undefined,
    };

    return next();
  } catch (error) {
    return next(forbidden("Invalid Firebase token"));
  }
};
