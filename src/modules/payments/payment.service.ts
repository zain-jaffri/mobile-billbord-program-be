import { Payment } from "./payment.model";
import { Driver } from "../drivers/driver.model";
import { notFound } from "../../shared/errors";

// Payment domain logic (listing, assignment, deletion).
export class PaymentService {
  constructor(
    private readonly models: {
      Payment: typeof Payment;
      Driver: typeof Driver;
    }
  ) {}

  public async listPayments(): Promise<Payment[]> {
    return this.models.Payment.findAll({
      include: [this.models.Driver],
      order: [["date", "DESC"]],
    });
  }

  public async getPayment(paymentId: number): Promise<Payment> {
    const payment = await this.models.Payment.findByPk(paymentId, {
      include: [this.models.Driver],
    });
    if (!payment) {
      throw notFound("Payment not found");
    }
    return payment;
  }

  public async assignDriver(paymentId: number, driverId: number | null, createdBy?: string | null): Promise<void> {
    const payment = await this.models.Payment.findByPk(paymentId);
    if (!payment) {
      throw notFound("Payment not found");
    }

    await payment.update({ driverId, createdBy: createdBy ?? "sync" });
  }

  public async deletePayment(paymentId: number): Promise<void> {
    const payment = await this.models.Payment.findByPk(paymentId);
    if (!payment) {
      throw notFound("Payment not found");
    }
    await payment.destroy();
  }
}
