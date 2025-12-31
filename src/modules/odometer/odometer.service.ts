import { Op } from "sequelize";
import { OdometerReading } from "./odometer.model";
import { Vehicle } from "../vehicles/vehicle.model";
import { Driver } from "../drivers/driver.model";
import { notFound } from "../../shared/errors";

// Odometer domain logic: append-only readings and detail views.
export class OdometerService {
  constructor(
    private readonly models: {
      OdometerReading: typeof OdometerReading;
      Vehicle: typeof Vehicle;
      Driver: typeof Driver;
    }
  ) {}

  public async createReading(payload: {
    vehicleId: number;
    readingDate?: Date;
    mileage: number;
    notes?: string | null;
    createdBy?: string | null;
  }): Promise<OdometerReading> {
    // Insert new readings; never overwrite history.
    return this.models.OdometerReading.create({
      vehicleId: payload.vehicleId,
      readingDate: payload.readingDate ?? new Date(),
      mileage: payload.mileage,
      notes: payload.notes ?? null,
      createdBy: payload.createdBy ?? null,
    });
  }

  public async getReadingDetail(readingId: number): Promise<{
    reading: OdometerReading;
    otherReadings: OdometerReading[];
  }> {
    const reading = await this.models.OdometerReading.findByPk(readingId, {
      include: [{ model: this.models.Vehicle, include: [this.models.Driver] }],
    });

    if (!reading) {
      throw notFound("Odometer reading not found");
    }

    const otherReadings = await this.models.OdometerReading.findAll({
      where: { vehicleId: reading.vehicleId, readingId: { [Op.ne]: reading.readingId } },
      order: [["readingDate", "DESC"]],
    });

    return { reading, otherReadings };
  }

  public async updateReading(readingId: number, payload: {
    readingDate: Date;
    mileage: number;
    notes?: string | null;
    createdBy?: string | null;
  }): Promise<OdometerReading> {
    const existing = await this.models.OdometerReading.findByPk(readingId);
    if (!existing) {
      throw notFound("Odometer reading not found");
    }

    // We keep readings immutable for audit; a correction becomes a new reading entry.
    return this.models.OdometerReading.create({
      vehicleId: existing.vehicleId,
      readingDate: payload.readingDate,
      mileage: payload.mileage,
      notes: payload.notes ?? "Correction",
      createdBy: payload.createdBy ?? null,
    });
  }

  public async deleteReading(readingId: number): Promise<void> {
    const reading = await this.models.OdometerReading.findByPk(readingId);
    if (!reading) {
      throw notFound("Odometer reading not found");
    }
    await reading.destroy();
  }

  public async listReadings(): Promise<OdometerReading[]> {
    return this.models.OdometerReading.findAll({
      include: [{ model: this.models.Vehicle, include: [this.models.Driver] }],
      order: [["readingDate", "DESC"]],
    });
  }
}
