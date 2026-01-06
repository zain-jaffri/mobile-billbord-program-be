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
    const email = (payload.email as string | undefined)?.toLowerCase();

    const adminEmails = new Set(["jacob@maximuslaw.com", "maamoonzsalman@gmail.com"]);
    const roleFromEmail = () => {
      if (email && adminEmails.has(email)) return "admin";
      if (email && email.endsWith("@maximuslaw.com")) return "fieldWorker";
      return "driver";
    };

    const derivedRole = roleFromEmail();
    let profile = firebaseUid ? await AppUser.findOne({ where: { firebaseUid } }) : null;
    if (firebaseUid && firebaseUid !== "unknown") {
      if (profile) {
        const updates: { email?: string | null; role?: "driver" | "fieldWorker" | "admin" } = {};
        if (email && profile.email !== email) {
          updates.email = email;
        }
        if (profile.role !== derivedRole) {
          updates.role = derivedRole;
        }
        if (Object.keys(updates).length > 0) {
          await profile.update(updates);
          profile = await AppUser.findOne({ where: { firebaseUid } });
        }
      } else {
        profile = await AppUser.create({
          firebaseUid,
          email: email ?? null,
          role: derivedRole,
          driverId: null,
        });
      }
    }

    req.user = {
      username: email ?? (payload.user_id as string) ?? payload.sub ?? "unknown",
      uid: firebaseUid,
      email: email ?? undefined,
      role: (profile?.role as "driver" | "fieldWorker" | "admin" | null) ?? derivedRole,
      driverId: profile?.driverId ?? null,
    };

    if (req.user.role === "driver") {
      console.log("[auth] driver login:", { uid: req.user.uid, driverId: req.user.driverId });
    }

    return next();
  } catch (error) {
    console.error("[auth] firebase verify failed:", error);
    return next(forbidden("Invalid Firebase token"));
  }
};
