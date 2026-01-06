import { Router } from "express";
import { asyncHandler } from "../../shared/middleware/asyncHandler";
import { validate } from "../../shared/middleware/validate";
import { docusignTestSendSchema } from "./docusign.dto";
import { sendDocusignEnvelope, DocuSignError } from "../../shared/utils/docusign";
import { AppError } from "../../shared/errors";

export const docusignRouter = Router();

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
