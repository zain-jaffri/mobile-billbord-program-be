import { Router } from "express";
import crypto from "crypto";
import { asyncHandler } from "../../shared/middleware/asyncHandler";
import { validate } from "../../shared/middleware/validate";
import { docusignTestSendSchema } from "./docusign.dto";
import { sendDocusignEnvelope, DocuSignError, downloadCombinedEnvelopeDocument } from "../../shared/utils/docusign";
import { AppError } from "../../shared/errors";
import { config } from "../../shared/config";
import { Driver } from "../drivers/driver.model";
import { DriverContract } from "../contracts/driverContract.model";
import { uploadToSupabaseStorage } from "../../shared/utils/supabaseStorage";
import { getFirebaseAdmin } from "../../shared/firebaseAdmin";
import { AppUser } from "../../shared/appUser.model";
import { sendEmail } from "../../shared/utils/mailer";
import type { RequestWithUser } from "../../shared/middleware/requestContext";

export const docusignRouter = Router();

const appBaseUrl = process.env.APP_WEB_URL || "http://localhost:5173";

function generateTempPassword() {
  return crypto.randomBytes(12).toString("base64url").slice(0, 12);
}

function extractEnvelopeStatus(payload: unknown): { envelopeId?: string; status?: string; driverId?: number } {
  if (!payload || typeof payload !== "object") return {};
  const data = payload as Record<string, unknown>;
  const summary = (data.envelopeSummary || data.envelopeStatus || data) as Record<string, unknown> | undefined;
  const envelopeId =
    (summary?.envelopeId as string | undefined) ||
    (data.envelopeId as string | undefined) ||
    (data.envelope_id as string | undefined);
  const status =
    (summary?.status as string | undefined) ||
    (summary?.envelopeStatus as string | undefined) ||
    (data.status as string | undefined);

  let driverId: number | undefined;
  const customFields =
    (summary?.customFields as Record<string, unknown> | undefined) ||
    (data.customFields as Record<string, unknown> | undefined);
  const textFields = (customFields?.textCustomFields || []) as Array<Record<string, unknown>>;
  for (const field of textFields) {
    if (String(field.name || "").toLowerCase() === "driverid") {
      const raw = String(field.value || "").trim();
      if (/^\d+$/.test(raw)) {
        driverId = Number(raw);
      }
    }
  }

  return { envelopeId, status, driverId };
}

function verifyWebhookSignature(req: RequestWithUser): boolean {
  const secret = config.docusign.webhookSecret;
  if (!secret) return true;
  const signature = req.header("X-DocuSign-Signature-1") || req.header("x-docusign-signature-1");
  if (!signature || !req.rawBody) return false;
  const digest = crypto.createHmac("sha256", secret).update(req.rawBody).digest("base64");
  const sigBuffer = Buffer.from(signature);
  const digestBuffer = Buffer.from(digest);
  if (sigBuffer.length !== digestBuffer.length) return false;
  return crypto.timingSafeEqual(sigBuffer, digestBuffer);
}

docusignRouter.post(
  "/docusign/test-send",
  validate(docusignTestSendSchema),
  asyncHandler(async (req, res) => {
    const { name, email } = req.body;
    try {
      await sendDocusignEnvelope({ name, email, driverId: 0 });
      res.status(200).json({ status: "sent" });
    } catch (error) {
      if (error instanceof DocuSignError) {
        console.error("[docusign] test send failed", {
          category:
            error.code === "consent_required"
              ? "consent_required"
              : error.code === "invalid_grant" || error.code === "unauthorized_client"
                ? "invalid_credentials"
                : error.status === 401
                  ? "unauthorized"
                  : error.status === 403
                    ? "forbidden"
                    : error.status === 404
                      ? "not_found"
                      : error.status === 429
                        ? "rate_limited"
                        : error.status === 400
                          ? "bad_request"
                          : "unknown",
          email,
          name,
          status: error.status,
          code: error.code,
          traceToken: error.traceToken,
          details: error.details,
          cors: "not_applicable_server_to_server",
        });
        throw new AppError(error.status ?? 502, "DocuSign send failed", {
          code: error.code,
          status: error.status,
          traceToken: error.traceToken,
          details: error.details,
        });
      }

      console.error("[docusign] test send failed", {
        email,
        name,
        error: error instanceof Error ? { name: error.name, message: error.message } : error,
        cors: "not_applicable_server_to_server",
      });
      throw new AppError(502, "DocuSign send failed");
    }
  })
);

docusignRouter.post(
  "/webhooks/docusign",
  asyncHandler(async (req: RequestWithUser, res) => {
    if (!verifyWebhookSignature(req)) {
      res.status(401).json({ error: "Invalid DocuSign signature." });
      return;
    }

    const { envelopeId, status, driverId } = extractEnvelopeStatus(req.body);
    if (!envelopeId || !status) {
      res.status(200).json({ status: "ignored" });
      return;
    }
    if (status.toLowerCase() !== "completed") {
      res.status(200).json({ status: "ignored" });
      return;
    }
    if (!driverId) {
      console.warn("[docusign] missing driverId for envelope", { envelopeId });
      res.status(200).json({ status: "ignored" });
      return;
    }

    const existing = await DriverContract.findOne({ where: { envelopeId } });
    if (existing) {
      res.status(200).json({ status: "ok" });
      return;
    }

    const driver = await Driver.findByPk(driverId);
    if (!driver) {
      res.status(200).json({ status: "ignored" });
      return;
    }

    const { base64, contentType } = await downloadCombinedEnvelopeDocument(envelopeId);
    const fileName = `signed-contract-${driverId}.pdf`;
    const storagePath = `driver-contracts/${driverId}/docusign-${envelopeId}.pdf`;
    await uploadToSupabaseStorage(storagePath, base64, contentType);
    await DriverContract.create({
      driverId,
      envelopeId,
      fileName,
      storagePath,
      signedAt: new Date(),
    });

    await Driver.update({ isSignedContract: true }, { where: { driverId } });

    const email = driver.email?.toLowerCase();
    if (email) {
      const existingAppUser = await AppUser.findOne({ where: { driverId } });
      if (existingAppUser) {
        res.status(200).json({ status: "ok" });
        return;
      }
      const admin = getFirebaseAdmin();
      let firebaseUser = null;
      try {
        firebaseUser = await admin.auth().getUserByEmail(email);
      } catch (error) {
        if ((error as { code?: string })?.code !== "auth/user-not-found") {
          throw error;
        }
      }

      if (!firebaseUser) {
        const tempPassword = generateTempPassword();
        const created = await admin.auth().createUser({
          email,
          password: tempPassword,
          emailVerified: false,
        });
        await admin.auth().setCustomUserClaims(created.uid, {
          mustChangePassword: true,
          role: "driver",
        });

        await AppUser.create({
          firebaseUid: created.uid,
          email,
          role: "driver",
          driverId,
        });

        await sendEmail({
          to: email,
          subject: "Your Driver Account",
          text: `Your driver account has been created.\n\nUsername: ${email}\nTemporary password: ${tempPassword}\n\nLog in at ${appBaseUrl} and you will be prompted to change your password.`,
        });
      } else {
        const existing = await AppUser.findOne({ where: { firebaseUid: firebaseUser.uid } });
        if (existing) {
          await existing.update({ email, role: "driver", driverId });
        } else {
          await AppUser.create({
            firebaseUid: firebaseUser.uid,
            email,
            role: "driver",
            driverId,
          });
        }
      }
    }

    res.status(200).json({ status: "ok" });
  })
);
