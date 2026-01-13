import { Router } from "express";
import { MonthlySubmissionService } from "./monthlySubmission.service";
import { MonthlySubmissionController } from "./monthlySubmission.controller";
import { models } from "../../shared/db";
import { asyncHandler } from "../../shared/middleware/asyncHandler";
import { requireRole } from "../../shared/middleware/requireRole";
import { validate } from "../../shared/middleware/validate";
import {
  createMonthlySubmissionSchema,
  monthlySubmissionPhotoSchema,
  monthlySubmissionIdParamSchema,
} from "./monthlySubmission.dto";

const service = new MonthlySubmissionService({
  MonthlySubmission: models.MonthlySubmission,
  MonthlySubmissionPhoto: models.MonthlySubmissionPhoto,
});
const controller = new MonthlySubmissionController(service);

export const monthlySubmissionRouter = Router();

monthlySubmissionRouter.get(
  "/monthly-submissions/status",
  requireRole(["driver"]),
  asyncHandler(controller.getStatus)
);

monthlySubmissionRouter.post(
  "/monthly-submissions",
  requireRole(["driver"]),
  validate(createMonthlySubmissionSchema),
  asyncHandler(controller.upsertSubmission)
);

monthlySubmissionRouter.post(
  "/monthly-submissions/:submissionId/photos",
  requireRole(["driver"]),
  validate(monthlySubmissionPhotoSchema),
  asyncHandler(controller.uploadPhotos)
);

monthlySubmissionRouter.post(
  "/monthly-submissions/:submissionId/approve",
  requireRole(["admin"]),
  validate(monthlySubmissionIdParamSchema),
  asyncHandler(controller.approveSubmission)
);

monthlySubmissionRouter.post(
  "/monthly-submissions/:submissionId/unapprove",
  requireRole(["admin"]),
  validate(monthlySubmissionIdParamSchema),
  asyncHandler(controller.unapproveSubmission)
);
