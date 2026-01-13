import { Router } from "express";
import crypto from "crypto";
import { Op } from "sequelize";
import { asyncHandler } from "../../shared/middleware/asyncHandler";
import { Deployment } from "../deployments/deployment.model";
import { Vehicle } from "../vehicles/vehicle.model";
import { QRCode } from "../qrCodes/qrCode.model";
import { DriverResponseCount } from "../responseCounts/driverResponseCount.model";
import { TallyWebhookEvent } from "./tallyWebhookEvent.model";
import type { RequestWithUser } from "../../shared/middleware/requestContext";

const router = Router();

const QRID_KEYS = new Set(["qrid", "qr_id", "qr id"]);

function normalizeKey(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function extractQrIdFromFields(fields: unknown): string | null {
  if (!Array.isArray(fields)) return null;
  for (const field of fields) {
    if (!field || typeof field !== "object") continue;
    const entry = field as Record<string, unknown>;
    const label = normalizeKey(entry.label ?? entry.key ?? entry.id ?? entry.name);
    if (!QRID_KEYS.has(label)) continue;
    const value = entry.value ?? entry.answer ?? entry.text ?? entry.response;
    if (value == null) continue;
    const raw = String(value).trim();
    if (raw) return raw;
  }
  return null;
}

function extractQrIdFromUrl(value?: string | null): string | null {
  if (!value) return null;
  const match = value.match(/[?&]qrid=([^&]+)/i);
  return match ? decodeURIComponent(match[1]) : null;
}

function extractQrId(payload: Record<string, unknown>): string | null {
  const candidate =
    extractQrIdFromFields(payload.data && (payload.data as Record<string, unknown>).fields) ||
    extractQrIdFromFields(payload.fields) ||
    extractQrIdFromFields(payload.responses);

  if (candidate) return candidate;

  const urlCandidates = [
    (payload.data as Record<string, unknown> | undefined)?.url,
    (payload.data as Record<string, unknown> | undefined)?.formUrl,
    (payload.data as Record<string, unknown> | undefined)?.submissionUrl,
    payload.url,
  ]
    .filter((value): value is string => typeof value === "string")
    .map((value) => extractQrIdFromUrl(value))
    .filter(Boolean);

  if (urlCandidates.length > 0) return urlCandidates[0] ?? null;

  const rawMatch = JSON.stringify(payload).match(/qrid=([^&\\s"]+)/i);
  return rawMatch ? decodeURIComponent(rawMatch[1]) : null;
}

function parseSubmissionDate(payload: Record<string, unknown>): Date {
  const dateCandidates = [
    (payload.data as Record<string, unknown> | undefined)?.createdAt,
    (payload.data as Record<string, unknown> | undefined)?.submissionDate,
    payload.createdAt,
    payload.submissionDate,
  ];
  for (const candidate of dateCandidates) {
    if (typeof candidate === "string" || typeof candidate === "number") {
      const parsed = new Date(candidate);
      if (!Number.isNaN(parsed.getTime())) return parsed;
    }
  }
  return new Date();
}

function extractEventId(payload: Record<string, unknown>): string | null {
  const directCandidates = [
    payload.eventId,
    payload.id,
    payload.responseId,
    payload.submissionId,
    (payload.data as Record<string, unknown> | undefined)?.eventId,
    (payload.data as Record<string, unknown> | undefined)?.id,
    (payload.data as Record<string, unknown> | undefined)?.responseId,
    (payload.data as Record<string, unknown> | undefined)?.submissionId,
  ];

  for (const candidate of directCandidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
    if (typeof candidate === "number") {
      return String(candidate);
    }
  }

  return null;
}

function verifySignature(req: RequestWithUser, secret: string): boolean {
  const signatureHeader =
    req.header("tally-signature") ||
    req.header("x-tally-signature") ||
    req.header("tally-signature-256");
  if (!signatureHeader) return false;
  const signature = signatureHeader.replace(/^sha256=/, "");
  const rawBody = req.rawBody ?? Buffer.from(JSON.stringify(req.body ?? {}));
  const digest = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  if (signature.length !== digest.length) return false;
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

async function resolveQrNumericId(rawQrId: string): Promise<number | null> {
  if (/^\d+$/.test(rawQrId)) {
    return Number(rawQrId);
  }
  const qrCode = await QRCode.findOne({
    where: {
      [Op.or]: [{ codeValue: rawQrId }, { externalId: rawQrId }],
    },
  });
  return qrCode?.qrId ?? null;
}

async function resolveActiveVehicleId(qrId: number): Promise<number | null> {
  const deployments = await Deployment.findAll({
    where: { qrId },
    order: [["actionDate", "DESC"], ["createdAt", "DESC"]],
    limit: 1,
  });
  if (!deployments.length) return null;
  const latest = deployments[0];
  if (latest.actionType !== "assign") return null;
  return latest.vehicleId;
}

router.post(
  "/webhooks/tally",
  asyncHandler(async (req: RequestWithUser, res) => {
    const secret = process.env.TALLY_WEBHOOK_SECRET;
    if (secret && !verifySignature(req, secret)) {
      res.status(401).json({ error: "Invalid signature" });
      return;
    }

    const payload = (req.body ?? {}) as Record<string, unknown>;
    const rawBody = req.rawBody ?? Buffer.from(JSON.stringify(payload));
    const fallbackEventId = crypto.createHash("sha256").update(rawBody).digest("hex");
    const eventId = extractEventId(payload) ?? fallbackEventId;

    const existingEvent = await TallyWebhookEvent.findOne({ where: { eventId } });
    if (existingEvent) {
      res.status(200).json({ status: "duplicate" });
      return;
    }

    const rawQrId = extractQrId(payload);
    if (!rawQrId) {
      res.status(202).json({ status: "ignored", reason: "missing_qrid" });
      return;
    }

    const qrId = await resolveQrNumericId(rawQrId);
    if (!qrId) {
      res.status(202).json({ status: "ignored", reason: "unknown_qrid" });
      return;
    }

    const vehicleId = await resolveActiveVehicleId(qrId);
    if (!vehicleId) {
      res.status(202).json({ status: "ignored", reason: "qr_not_assigned" });
      return;
    }

    const vehicle = await Vehicle.findByPk(vehicleId);
    const driverId = vehicle?.driverId ?? null;
    if (!driverId) {
      res.status(202).json({ status: "ignored", reason: "missing_driver" });
      return;
    }

    const submittedAt = parseSubmissionDate(payload);
    const year = submittedAt.getUTCFullYear();
    const month = submittedAt.getUTCMonth() + 1;

    const [record, created] = await DriverResponseCount.findOrCreate({
      where: { driverId, year, month },
      defaults: { count: 1 },
    });
    if (!created) {
      await record.increment("count", { by: 1 });
    }

    await TallyWebhookEvent.create({ eventId, receivedAt: new Date() });

    res.status(200).json({ status: "ok" });
  })
);

export const tallyWebhookRouter = router;
