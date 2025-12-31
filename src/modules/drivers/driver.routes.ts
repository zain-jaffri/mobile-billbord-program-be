import { Router } from "express";
import { DriverController } from "./driver.controller";
import { DriverService } from "./driver.service";
import { DeploymentService } from "../deployments/deployment.service";
import { models } from "../../shared/db";
import { asyncHandler } from "../../shared/middleware/asyncHandler";
import { validate } from "../../shared/middleware/validate";
import {
  createDriverSchema,
  returningDriverSchema,
  updateDriverSchema,
  driverIdParamSchema,
  searchDriversSchema,
} from "./driver.dto";

// Manual wiring keeps dependencies explicit and testable.
const deploymentService = new DeploymentService({
  Deployment: models.Deployment,
  Vehicle: models.Vehicle,
  Driver: models.Driver,
  QRCode: models.QRCode,
});
const driverService = new DriverService(
  {
    Driver: models.Driver,
    Vehicle: models.Vehicle,
    Deployment: models.Deployment,
    OdometerReading: models.OdometerReading,
    FormSubmission: models.FormSubmission,
    Payment: models.Payment,
  },
  deploymentService
);
const controller = new DriverController(driverService);

export const driverRouter = Router();

// Routes only define HTTP + validation. Business logic lives in services.
driverRouter.post("/drivers", validate(createDriverSchema), asyncHandler(controller.createDriver));
driverRouter.post("/returningdriver", validate(returningDriverSchema), asyncHandler(controller.returningDriver));
driverRouter.get("/drivers", asyncHandler(controller.listDrivers));
driverRouter.get("/drivers/:driverId", validate(driverIdParamSchema), asyncHandler(controller.getDriverDetail));
driverRouter.post("/drivers/:driverId/update", validate(updateDriverSchema), asyncHandler(controller.updateDriver));
driverRouter.get("/search/drivers", validate(searchDriversSchema), asyncHandler(controller.searchDrivers));
