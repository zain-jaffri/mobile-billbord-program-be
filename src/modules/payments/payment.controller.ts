import { Request, Response } from "express";
import { PaymentService } from "./payment.service";
import { RequestWithUser } from "../../shared/middleware/requestContext";

// HTTP layer for payment endpoints.
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  public listPayments = async (_req: Request, res: Response): Promise<void> => {
    const payments = await this.paymentService.listPayments();
    res.status(200).json(payments);
  };

  public getPayment = async (req: Request, res: Response): Promise<void> => {
    const payment = await this.paymentService.getPayment(Number(req.params.paymentId));
    res.status(200).json(payment);
  };

  public assignDriver = async (req: RequestWithUser, res: Response): Promise<void> => {
    const createdBy = req.user?.username ?? null;
    await this.paymentService.assignDriver(Number(req.params.paymentId), req.body.driverId ?? null, createdBy);
    res.status(200).json({ status: "ok" });
  };

  public deletePayment = async (req: Request, res: Response): Promise<void> => {
    await this.paymentService.deletePayment(Number(req.params.paymentId));
    res.status(204).send();
  };
}
