import { createRemoteJWKSet, jwtVerify } from "jose";
import { Request, Response, NextFunction } from "express";
import { config } from "../config";
import type { RequestWithUser } from "./requestContext";
import { forbidden } from "../errors";
import { AppUser } from "../appUser.model";

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
  console.log("[auth] firebase token:", token);

  try {
    const { payload } = await jwtVerify(token, jwks, {
      issuer: `https://securetoken.google.com/${config.firebase.projectId}`,
      audience: config.firebase.projectId,
    });

    const firebaseUid = (payload.user_id as string) ?? payload.sub ?? "unknown";
    const profile = firebaseUid
      ? await AppUser.findOne({ where: { firebaseUid } })
      : null;

    req.user = {
      username: (payload.email as string) ?? (payload.user_id as string) ?? payload.sub ?? "unknown",
      uid: firebaseUid,
      email: (payload.email as string) ?? undefined,
      role: profile?.role ?? null,
      driverId: profile?.driverId ?? null,
    };

    if (req.user.role === "driver") {
      console.log("[auth] driver login:", { uid: req.user.uid, driverId: req.user.driverId });
    }

    return next();
  } catch (error) {
    return next(forbidden("Invalid Firebase token"));
  }
};
