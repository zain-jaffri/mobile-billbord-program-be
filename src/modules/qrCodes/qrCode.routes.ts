import { Router } from "express";
import { QRCodeController } from "./qrCode.controller";
import { QRCodeService } from "./qrCode.service";
import { DeploymentService } from "../deployments/deployment.service";
import { models } from "../../shared/db";
import { asyncHandler } from "../../shared/middleware/asyncHandler";
import { validate } from "../../shared/middleware/validate";
import { createQrSchema, updateQrSchema, qrIdParamSchema, searchQrSchema } from "./qrCode.dto";

// Manual wiring keeps dependencies explicit and testable.
const deploymentService = new DeploymentService({
  Deployment: models.Deployment,
  Vehicle: models.Vehicle,
  Driver: models.Driver,
  QRCode: models.QRCode,
});
const qrService = new QRCodeService(
  {
    QRCode: models.QRCode,
    Deployment: models.Deployment,
    Vehicle: models.Vehicle,
    FormSubmission: models.FormSubmission,
  },
  deploymentService
);
const controller = new QRCodeController(qrService);

export const qrCodeRouter = Router();

// Routes only define HTTP + validation. Business logic lives in services.
qrCodeRouter.post("/qr-codes", validate(createQrSchema), asyncHandler(controller.createQr));
qrCodeRouter.post("/qr-codes/:qrId/update", validate(updateQrSchema), asyncHandler(controller.updateQr));
qrCodeRouter.post("/qr-codes/:qrId/delete", validate(qrIdParamSchema), asyncHandler(controller.deleteQr));
qrCodeRouter.get("/qr-codes", asyncHandler(controller.listQrs));
qrCodeRouter.get("/qr-codes/:qrId", validate(qrIdParamSchema), asyncHandler(controller.getQrDetail));
qrCodeRouter.get("/qr-codes/:qrId/submissions", validate(qrIdParamSchema), asyncHandler(controller.listSubmissionsForQr));
qrCodeRouter.get("/search/qrs", validate(searchQrSchema), asyncHandler(controller.searchQrs));
