import { Router } from "express";
import { PaymentController } from "./payment.controller";
import { PaymentService } from "./payment.service";
import { models } from "../../shared/db";
import { asyncHandler } from "../../shared/middleware/asyncHandler";
import { validate } from "../../shared/middleware/validate";
import { paymentIdParamSchema, assignPaymentDriverSchema } from "./payment.dto";

// Manual wiring keeps dependencies explicit and testable.
const paymentService = new PaymentService({
  Payment: models.Payment,
  Driver: models.Driver,
});
const controller = new PaymentController(paymentService);

export const paymentRouter = Router();

// Routes only define HTTP + validation. Business logic lives in services.
paymentRouter.get("/payments", asyncHandler(controller.listPayments));
paymentRouter.get("/payments/:paymentId", validate(paymentIdParamSchema), asyncHandler(controller.getPayment));
paymentRouter.post("/payments/:paymentId/assign-driver", validate(assignPaymentDriverSchema), asyncHandler(controller.assignDriver));
paymentRouter.post("/payments/:paymentId/delete", validate(paymentIdParamSchema), asyncHandler(controller.deletePayment));
