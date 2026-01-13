import { Router } from "express";
import { VehicleController } from "./vehicle.controller";
import { VehicleService } from "./vehicle.service";
import { DeploymentService } from "../deployments/deployment.service";
import { models } from "../../shared/db";
import { asyncHandler } from "../../shared/middleware/asyncHandler";
import { validate } from "../../shared/middleware/validate";
import {
  createVehicleSchema,
  updateVehicleSchema,
  vehicleIdParamSchema,
  searchVehiclesSchema,
} from "./vehicle.dto";

// Manual wiring keeps dependencies explicit and testable.
const deploymentService = new DeploymentService({
  Deployment: models.Deployment,
  Vehicle: models.Vehicle,
  Driver: models.Driver,
  QRCode: models.QRCode,
});
const vehicleService = new VehicleService(
  {
    Vehicle: models.Vehicle,
    Driver: models.Driver,
    Deployment: models.Deployment,
    QRCode: models.QRCode,
    FormSubmission: models.FormSubmission,
    OdometerReading: models.OdometerReading,
  },
  deploymentService
);
const controller = new VehicleController(vehicleService);

export const vehicleRouter = Router();

// Routes only define HTTP + validation. Business logic lives in services.
vehicleRouter.post("/vehicles", validate(createVehicleSchema), asyncHandler(controller.createVehicle));
vehicleRouter.post("/vehicles/:vehicleId/update", validate(updateVehicleSchema), asyncHandler(controller.updateVehicle));
vehicleRouter.post("/vehicles/:vehicleId/delete", validate(vehicleIdParamSchema), asyncHandler(controller.deleteVehicle));
vehicleRouter.get("/vehicles", asyncHandler(controller.listVehicles));
vehicleRouter.get("/vehicles/:vehicleId", validate(vehicleIdParamSchema), asyncHandler(controller.getVehicleDetail));
vehicleRouter.get("/vehicles/:vehicleId/deployments_current", validate(vehicleIdParamSchema), asyncHandler(controller.listActiveDeployments));
vehicleRouter.get("/vehicles/:vehicleId/odometer_last", validate(vehicleIdParamSchema), asyncHandler(controller.getLastOdometer));
vehicleRouter.get("/search/vehicles", validate(searchVehiclesSchema), asyncHandler(controller.searchVehicles));
