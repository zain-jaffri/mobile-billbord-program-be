import { Router } from "express";
import { SubmissionController } from "./submission.controller";
import { SubmissionService } from "./submission.service";
import { DeploymentService } from "../deployments/deployment.service";
import { models } from "../../shared/db";
import { asyncHandler } from "../../shared/middleware/asyncHandler";
import { validate } from "../../shared/middleware/validate";
import { createSubmissionSchema, submissionIdParamSchema, assignQrSchema } from "./submission.dto";

// Manual wiring keeps dependencies explicit and testable.
const deploymentService = new DeploymentService({
  Deployment: models.Deployment,
  Vehicle: models.Vehicle,
  Driver: models.Driver,
  QRCode: models.QRCode,
});
const submissionService = new SubmissionService(
  {
    FormSubmission: models.FormSubmission,
    QRCode: models.QRCode,
    Deployment: models.Deployment,
    Vehicle: models.Vehicle,
    Driver: models.Driver,
  },
  deploymentService
);
const controller = new SubmissionController(submissionService);

export const submissionRouter = Router();

// Routes only define HTTP + validation. Business logic lives in services.
submissionRouter.post("/submissions", validate(createSubmissionSchema), asyncHandler(controller.createSubmission));
submissionRouter.get("/submissions", asyncHandler(controller.listSubmissions));
submissionRouter.get("/submissions/:submissionId", validate(submissionIdParamSchema), asyncHandler(controller.getSubmission));
submissionRouter.post("/submissions/:submissionId/delete", validate(submissionIdParamSchema), asyncHandler(controller.deleteSubmission));
submissionRouter.post("/submissions/:submissionId/assign-qr", validate(assignQrSchema), asyncHandler(controller.assignQr));
