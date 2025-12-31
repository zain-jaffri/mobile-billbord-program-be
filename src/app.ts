import express from "express";
import { driverRouter } from "./modules/drivers/driver.routes";
import { vehicleRouter } from "./modules/vehicles/vehicle.routes";
import { deploymentRouter } from "./modules/deployments/deployment.routes";
import { qrCodeRouter } from "./modules/qrCodes/qrCode.routes";
import { odometerRouter } from "./modules/odometer/odometer.routes";
import { submissionRouter } from "./modules/submissions/submission.routes";
import { paymentRouter } from "./modules/payments/payment.routes";
import { errorHandler } from "./shared/middleware/errorHandler";
import { requestContext } from "./shared/middleware/requestContext";
import { requestLogger } from "./shared/middleware/requestLogger";
import { asyncHandler } from "./shared/middleware/asyncHandler";
import { sequelize } from "./shared/sequelize";

// App wiring lives here: middleware, health checks, and route mounting.
export const createApp = () => {
  const app = express();

  // Parse JSON and form bodies before any route handlers.
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  // Attach user context and per-request logging early.
  app.use(requestContext);
  app.use(requestLogger);

  app.get(
    "/health/db",
    asyncHandler(async (_req, res) => {
      // Lightweight ping to confirm DB connectivity.
      await sequelize.query("SELECT 1");
      res.status(200).json({ status: "ok" });
    })
  );

  // Domain routers.
  app.use(driverRouter);
  app.use(vehicleRouter);
  app.use(deploymentRouter);
  app.use(qrCodeRouter);
  app.use(odometerRouter);
  app.use(submissionRouter);
  app.use(paymentRouter);

  // Centralized error handling goes last.
  app.use(errorHandler);

  return app;
};
