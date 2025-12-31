import express from "express";
import cors from "cors";
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
import { authenticateFirebase } from "./shared/middleware/firebaseAuth";

// App wiring lives here: middleware, health checks, and route mounting.
export const createApp = () => {
  const app = express();

  // Allow browser clients (Vite dev server) to call the API.
  app.use(
    cors({
      origin: ["http://localhost:5173"],
      credentials: true,
    })
  );

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

  app.get(
    "/auth/debug",
    authenticateFirebase,
    asyncHandler(async (req, res) => {
      // Returns decoded Firebase user info for end-to-end auth verification.
      res.status(200).json({ user: req.user ?? null });
    })
  );

  // Handle preflight before auth to avoid 403 on OPTIONS.
  app.options("*", cors());

  // Protect all business endpoints with Firebase auth.
  app.use((req, res, next) => {
    if (req.path === "/health/db") {
      return next();
    }
    if (req.method === "OPTIONS") {
      return next();
    }
    return authenticateFirebase(req, res, next);
  });

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
