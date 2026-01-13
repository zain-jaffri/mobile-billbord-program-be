import { Router } from "express";
import { DeploymentController } from "./deployment.controller";
import { DeploymentService } from "./deployment.service";
import { models } from "../../shared/db";
import { asyncHandler } from "../../shared/middleware/asyncHandler";
import { validate } from "../../shared/middleware/validate";
import {
  createDeploymentSchema,
  updateDeploymentSchema,
  deploymentIdParamSchema,
} from "./deployment.dto";

// Manual wiring keeps dependencies explicit and testable.
const deploymentService = new DeploymentService({
  Deployment: models.Deployment,
  Vehicle: models.Vehicle,
  Driver: models.Driver,
  QRCode: models.QRCode,
});
const controller = new DeploymentController(deploymentService);

export const deploymentRouter = Router();

// Routes only define HTTP + validation. Business logic lives in services.
deploymentRouter.post("/deployments", validate(createDeploymentSchema), asyncHandler(controller.createDeployment));
deploymentRouter.post("/deployments/:deploymentId/update", validate(updateDeploymentSchema), asyncHandler(controller.updateDeployment));
deploymentRouter.post("/deployments/:deploymentId/delete", validate(deploymentIdParamSchema), asyncHandler(controller.deleteDeployment));
deploymentRouter.get("/deployments", asyncHandler(controller.listDeployments));
deploymentRouter.get("/deployments/:deploymentId", validate(deploymentIdParamSchema), asyncHandler(controller.getDeployment));
