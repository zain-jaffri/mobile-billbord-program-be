import { Router } from "express";
import { OdometerController } from "./odometer.controller";
import { OdometerService } from "./odometer.service";
import { models } from "../../shared/db";
import { asyncHandler } from "../../shared/middleware/asyncHandler";
import { validate } from "../../shared/middleware/validate";
import { createOdometerSchema, updateOdometerSchema, readingIdParamSchema } from "./odometer.dto";

// Manual wiring keeps dependencies explicit and testable.
const odometerService = new OdometerService({
  OdometerReading: models.OdometerReading,
  Vehicle: models.Vehicle,
  Driver: models.Driver,
});
const controller = new OdometerController(odometerService);

export const odometerRouter = Router();

// Routes only define HTTP + validation. Business logic lives in services.
odometerRouter.post("/odometer-readings", validate(createOdometerSchema), asyncHandler(controller.createReading));
odometerRouter.post("/odometer-readings/:readingId/update", validate(updateOdometerSchema), asyncHandler(controller.updateReading));
odometerRouter.post("/odometer-readings/:readingId/delete", validate(readingIdParamSchema), asyncHandler(controller.deleteReading));
odometerRouter.get("/odometer-readings", asyncHandler(controller.listReadings));
odometerRouter.get("/odometer-readings/:readingId", validate(readingIdParamSchema), asyncHandler(controller.getReading));
