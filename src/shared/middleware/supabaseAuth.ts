import { createRemoteJWKSet, jwtVerify } from "jose";
import { Response, NextFunction } from "express";
import type { RequestWithUser } from "./requestContext";
import { forbidden } from "../errors";
import { config } from "../config";
import { UserProfile } from "../userProfile.model";

const supabaseOrigin = new URL(config.supabase.url).origin;
const jwks = createRemoteJWKSet(new URL(`${supabaseOrigin}/auth/v1/keys`), {
  headers: {
    apikey: config.supabase.serviceRoleKey,
    Authorization: `Bearer ${config.supabase.serviceRoleKey}`,
  },
});

// Verifies Supabase access tokens from the Authorization header.
export const authenticateSupabase = async (
  req: RequestWithUser,
  _res: Response,
  next: NextFunction
) => {
  const authHeader = req.header("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return next(forbidden("Missing Authorization header"));
  }

  const token = authHeader.slice("Bearer ".length).trim();

  try {
    const { payload } = await jwtVerify(token, jwks, {
      issuer: `${supabaseOrigin}/auth/v1`,
      audience: ["authenticated", "anon"],
    });

    const uid = (payload.sub as string) ?? "unknown";
    const email = (payload.email as string) ?? undefined;
    const profile = uid ? await UserProfile.findByPk(uid) : null;
    const driverId =
      profile?.driverId != null ? Number(profile.driverId) : null;

    req.user = {
      username: email ?? uid,
      uid,
      email,
      role: profile?.role ?? null,
      driverId,
    };

    if (req.user.role === "driver") {
      console.log("[auth] driver login:", { uid: req.user.uid, driverId: req.user.driverId });
    }

    return next();
  } catch (error) {
    console.error("[auth] supabase token error:", error);
    return next(forbidden("Invalid Supabase token"));
  }
};
