import { Router } from "express";
import { z } from "zod";
import crypto from "crypto";
import { asyncHandler } from "../../shared/middleware/asyncHandler";
import { requireRole } from "../../shared/middleware/requireRole";
import { AppUser } from "../../shared/appUser.model";
import { getFirebaseAdmin } from "../../shared/firebaseAdmin";
import { sendEmail } from "../../shared/utils/mailer";
import type { RequestWithUser } from "../../shared/middleware/requestContext";

const router = Router();

const createFieldWorkerSchema = z.object({
  email: z.string().email(),
});

const resetFieldWorkerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const appBaseUrl = process.env.APP_WEB_URL || "http://localhost:5173";

function generateTempPassword() {
  return crypto.randomBytes(12).toString("base64url").slice(0, 12);
}

router.post(
  "/admin/field-workers",
  requireRole(["admin"]),
  asyncHandler(async (req, res) => {
    const { email } = createFieldWorkerSchema.parse(req.body);
    const normalizedEmail = email.toLowerCase();
    const admin = getFirebaseAdmin();

    try {
      await admin.auth().getUserByEmail(normalizedEmail);
      res.status(409).json({ message: "User already exists." });
      return;
    } catch (error) {
      if ((error as { code?: string })?.code !== "auth/user-not-found") {
        throw error;
      }
    }

    const tempPassword = generateTempPassword();
    const created = await admin.auth().createUser({
      email: normalizedEmail,
      password: tempPassword,
      emailVerified: false,
    });

    await admin.auth().setCustomUserClaims(created.uid, {
      mustChangePassword: true,
      role: "fieldWorker",
    });

    const existing = await AppUser.findOne({ where: { firebaseUid: created.uid } });
    if (existing) {
      await existing.update({ email: normalizedEmail, role: "fieldWorker" });
    } else {
      await AppUser.create({
        firebaseUid: created.uid,
        email: normalizedEmail,
        role: "fieldWorker",
        driverId: null,
      });
    }

    await sendEmail({
      to: normalizedEmail,
      subject: "Your Field Worker Account",
      text: `Your field worker account has been created.\n\nUsername: ${normalizedEmail}\nTemporary password: ${tempPassword}\n\nLog in at ${appBaseUrl} and you will be prompted to change your password.`,
    });

    res.status(201).json({ message: "Field worker account created and email sent." });
  })
);

router.post(
  "/admin/field-workers/reset-password",
  requireRole(["admin"]),
  asyncHandler(async (req, res) => {
    const { email, password } = resetFieldWorkerSchema.parse(req.body);
    const normalizedEmail = email.toLowerCase();
    const admin = getFirebaseAdmin();

    const user = await admin.auth().getUserByEmail(normalizedEmail);
    await admin.auth().updateUser(user.uid, { password });
    await admin.auth().setCustomUserClaims(user.uid, {
      mustChangePassword: true,
      role: "fieldWorker",
    });

    const existing = await AppUser.findOne({ where: { firebaseUid: user.uid } });
    if (existing) {
      await existing.update({ email: normalizedEmail, role: "fieldWorker" });
    } else {
      await AppUser.create({
        firebaseUid: user.uid,
        email: normalizedEmail,
        role: "fieldWorker",
        driverId: null,
      });
    }

    await sendEmail({
      to: normalizedEmail,
      subject: "Your Field Worker Password Reset",
      text: `Your password has been reset by an administrator.\n\nUsername: ${normalizedEmail}\nTemporary password: ${password}\n\nLog in at ${appBaseUrl} and you will be prompted to change your password.`,
    });

    res.status(200).json({ message: "Password reset and email sent." });
  })
);

router.post(
  "/auth/clear-password-reset",
  asyncHandler(async (req: RequestWithUser, res) => {
    const uid = req.user?.uid;
    if (!uid) {
      res.status(401).json({ message: "Missing user context." });
      return;
    }
    const admin = getFirebaseAdmin();
    const user = await admin.auth().getUser(uid);
    const existingClaims = user.customClaims ?? {};
    await admin.auth().setCustomUserClaims(uid, {
      ...existingClaims,
      mustChangePassword: false,
    });
    res.status(200).json({ message: "Password change confirmed." });
  })
);

export const adminRouter = router;
