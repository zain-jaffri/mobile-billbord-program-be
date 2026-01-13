import { Op, Sequelize } from "sequelize";
import { Vehicle } from "./vehicle.model";
import { Driver } from "../drivers/driver.model";
import { Deployment } from "../deployments/deployment.model";
import { QRCode } from "../qrCodes/qrCode.model";
import { FormSubmission } from "../submissions/submission.model";
import { OdometerReading } from "../odometer/odometer.model";
import { notFound } from "../../shared/errors";
import { DeploymentService } from "../deployments/deployment.service";

// Vehicle domain logic: detail views, searches, and computed deltas.
export class VehicleService {
  constructor(
    private readonly models: {
      Vehicle: typeof Vehicle;
      Driver: typeof Driver;
      Deployment: typeof Deployment;
      QRCode: typeof QRCode;
      FormSubmission: typeof FormSubmission;
      OdometerReading: typeof OdometerReading;
    },
    private readonly deploymentService: DeploymentService
  ) {}

  public async createVehicle(payload: {
    driverId?: number | null;
    plateNumber?: string | null;
    state?: string | null;
    make?: string | null;
    model?: string | null;
    year?: number | null;
    vin?: string | null;
    color?: string | null;
    notes?: string | null;
    createdBy?: string | null;
  }): Promise<Vehicle> {
    return this.models.Vehicle.create(payload);
  }

  public async updateVehicle(vehicleId: number, payload: {
    driverId?: number | null;
    plateNumber?: string | null;
    state?: string | null;
    make?: string | null;
    model?: string | null;
    year?: number | null;
    vin?: string | null;
    color?: string | null;
    notes?: string | null;
    createdBy?: string | null;
  }): Promise<Vehicle> {
    const vehicle = await this.models.Vehicle.findByPk(vehicleId);
    if (!vehicle) {
      throw notFound("Vehicle not found");
    }

    await vehicle.update(payload);
    return vehicle;
  }

  public async deleteVehicle(vehicleId: number): Promise<void> {
    const vehicle = await this.models.Vehicle.findByPk(vehicleId);
    if (!vehicle) {
      throw notFound("Vehicle not found");
    }
    await vehicle.destroy();
  }

  public async listVehicles(): Promise<Vehicle[]> {
    return this.models.Vehicle.findAll({
      include: [{ model: this.models.Driver }],
      order: [["year", "DESC"], ["make", "ASC"], ["model", "ASC"]],
    });
  }

  public async getVehicleDetail(vehicleId: number): Promise<{
    vehicle: Vehicle;
    deployments: Array<Deployment & { submissions: FormSubmission[] }>;
    odometerHistory: Array<OdometerReading & {
      deltaDays?: number | null;
      deltaMiles?: number | null;
      deltaMilesPerDay?: number | null;
    }>;
  }> {
    const vehicle = await this.models.Vehicle.findByPk(vehicleId, {
      include: [{ model: this.models.Driver }],
    });

    if (!vehicle) {
      throw notFound("Vehicle not found");
    }

    const deployments = await this.models.Deployment.findAll({
      where: { vehicleId },
      include: [{ model: this.models.QRCode }],
      order: [["actionDate", "DESC"]],
    });

    const deploymentResults: Array<Deployment & { submissions: FormSubmission[] }> = [];
    // Attach submissions per QR for each deployment.
    for (const deployment of deployments) {
      const submissions = await this.models.FormSubmission.findAll({
        where: { qrId: deployment.qrId },
        order: [["submissionDate", "DESC"]],
      });
      deploymentResults.push(Object.assign(deployment, { submissions }));
    }

    const odometerHistory = await this.models.OdometerReading.findAll({
      where: { vehicleId },
      order: [["readingDate", "DESC"]],
    });

    // Compute deltas between consecutive readings for reporting.
    for (let i = 1; i < odometerHistory.length; i += 1) {
      const newer = odometerHistory[i - 1];
      const older = odometerHistory[i];
      const newerDate = new Date(newer.readingDate);
      const olderDate = new Date(older.readingDate);
      const deltaDays = Math.floor((newerDate.getTime() - olderDate.getTime()) / (1000 * 60 * 60 * 24));
      const deltaMiles = newer.mileage - older.mileage;
      newer.setDataValue("deltaDays", deltaDays);
      newer.setDataValue("deltaMiles", deltaMiles);
      newer.setDataValue("deltaMilesPerDay", deltaDays > 0 ? deltaMiles / deltaDays : null);
    }

    return { vehicle, deployments: deploymentResults, odometerHistory };
  }

  public async listActiveDeployments(vehicleId: number): Promise<Deployment[]> {
    return this.deploymentService.listActiveForVehicle(vehicleId);
  }

  public async getLatestOdometer(vehicleId: number): Promise<OdometerReading | null> {
    return this.models.OdometerReading.findOne({
      where: { vehicleId },
      order: [["readingDate", "DESC"]],
    });
  }

  public async searchVehicles(query: { q?: string; driverId?: number }): Promise<Vehicle[]> {
    const q = query.q ?? "";
    return this.models.Vehicle.findAll({
      include: [{ model: this.models.Driver }],
      where: {
        ...(query.driverId ? { driverId: query.driverId } : {}),
        [Op.and]: q
          ? [
              {
                [Op.or]: [
                  Sequelize.where(Sequelize.cast(Sequelize.col("Vehicle.vehicle_id"), "CHAR"), {
                    [Op.like]: `%${q}%`,
                  }),
                  { make: { [Op.like]: `%${q}%` } },
                  { model: { [Op.like]: `%${q}%` } },
                  { plateNumber: { [Op.like]: `%${q}%` } },
                  Sequelize.where(Sequelize.col("Driver.first_name"), { [Op.like]: `%${q}%` }),
                  Sequelize.where(Sequelize.col("Driver.last_name"), { [Op.like]: `%${q}%` }),
                ],
              },
            ]
          : [],
      },
      order: [["year", "DESC"]],
      limit: 10,
    });
  }
}
