import { Transaction, Op, Sequelize } from "sequelize";
import { Deployment } from "./deployment.model";
import { Vehicle } from "../vehicles/vehicle.model";
import { Driver } from "../drivers/driver.model";
import { QRCode } from "../qrCodes/qrCode.model";
import { badRequest, forbidden, notFound } from "../../shared/errors";

// Deployment domain logic and centralized "active" determination.
export class DeploymentService {
  constructor(
    private readonly models: {
      Deployment: typeof Deployment;
      Vehicle: typeof Vehicle;
      Driver: typeof Driver;
      QRCode: typeof QRCode;
    }
  ) {}

  // Enforces driver state rules before assigning a QR.
  private async assertAssignable(vehicleId: number, transaction?: Transaction): Promise<void> {
    const vehicle = await this.models.Vehicle.findByPk(vehicleId, {
      include: [{ model: this.models.Driver }],
      transaction,
    });

    if (!vehicle || !vehicle.Driver) {
      throw notFound("Driver not found for vehicle");
    }

    if (vehicle.Driver.isInactive) {
      throw forbidden("Cannot assign QR to inactive driver");
    }
  }

  // Centralized active-assignment logic: assign with no later unassign.
  public async listActiveForVehicle(vehicleId: number, transaction?: Transaction): Promise<Deployment[]> {
    return this.models.Deployment.findAll({
      where: {
        vehicleId,
        actionType: "assign",
        [Op.and]: Sequelize.literal(`NOT EXISTS (
          SELECT 1
          FROM deployments d2
          WHERE d2.vehicle_id = "Deployment"."vehicle_id"
            AND d2.qr_id = "Deployment"."qr_id"
            AND d2.action_type = 'unassign'
            AND d2.action_date > "Deployment"."action_date"
        )`),
      },
      include: [{ model: this.models.QRCode }],
      order: [["actionDate", "DESC"]],
      transaction,
    });
  }

  public async isDeploymentActive(deploymentId: number): Promise<boolean> {
    const deployment = await this.models.Deployment.findByPk(deploymentId);
    if (!deployment) {
      throw notFound("Deployment not found");
    }

    if (deployment.actionType !== "assign") {
      return false;
    }

    const unassign = await this.models.Deployment.findOne({
      where: {
        vehicleId: deployment.vehicleId,
        qrId: deployment.qrId,
        actionType: "unassign",
        actionDate: { [Op.gt]: deployment.actionDate },
      },
    });

    return !unassign;
  }

  public async createDeployment(payload: {
    vehicleId: number;
    qrId: number;
    actionType: "assign" | "unassign";
    actionDate: Date;
    notes?: string | null;
    createdBy?: string | null;
  }, transaction?: Transaction): Promise<Deployment> {
    if (payload.actionType === "assign") {
      await this.assertAssignable(payload.vehicleId, transaction);
    }

    return this.models.Deployment.create(payload, { transaction });
  }

  public async updateDeployment(
    deploymentId: number,
    payload: {
      vehicleId: number;
      qrId: number;
      actionType: "assign" | "unassign";
      actionDate: Date;
      notes?: string | null;
      createdBy?: string | null;
    }
  ): Promise<Deployment> {
    // This endpoint exists for parity with the legacy UI, but deployments are append-only events.
    // If this becomes a source of audit issues, consider emitting a correction event instead.
    if (payload.actionType === "assign") {
      await this.assertAssignable(payload.vehicleId);
    }

    const deployment = await this.models.Deployment.findByPk(deploymentId);
    if (!deployment) {
      throw notFound("Deployment not found");
    }

    await deployment.update(payload);
    return deployment;
  }

  public async deleteDeployment(deploymentId: number): Promise<void> {
    const deployment = await this.models.Deployment.findByPk(deploymentId);
    if (!deployment) {
      throw notFound("Deployment not found");
    }

    await deployment.destroy();
  }

  public async getDeploymentDetail(deploymentId: number): Promise<Deployment> {
    const deployment = await this.models.Deployment.findByPk(deploymentId, {
      include: [
        { model: this.models.Vehicle, include: [this.models.Driver] },
        { model: this.models.QRCode },
      ],
    });

    if (!deployment) {
      throw notFound("Deployment not found");
    }

    return deployment;
  }

  public async listDeployments(): Promise<Deployment[]> {
    return this.models.Deployment.findAll({
      include: [
        { model: this.models.Vehicle, include: [this.models.Driver] },
        { model: this.models.QRCode },
      ],
      order: [["deploymentId", "DESC"]],
    });
  }

  public async createUnassignForVehicle(vehicleId: number, qrId: number, createdBy?: string | null, transaction?: Transaction): Promise<void> {
    // Unassign event is appended instead of mutating prior records.
    await this.models.Deployment.create(
      {
        vehicleId,
        qrId,
        actionType: "unassign",
        actionDate: new Date(),
        notes: "Driver inactivated",
        createdBy: createdBy ?? null,
      },
      { transaction }
    );
  }

  public async getLatestDeploymentForVehicle(vehicleId: number, transaction?: Transaction): Promise<Deployment | null> {
    return this.models.Deployment.findOne({
      where: { vehicleId },
      order: [["deploymentId", "DESC"]],
      transaction,
    });
  }

  public async getActiveDeploymentForQr(qrId: number): Promise<Deployment | null> {
    return this.models.Deployment.findOne({
      where: {
        qrId,
        actionType: "assign",
        [Op.and]: Sequelize.literal(`NOT EXISTS (
          SELECT 1
          FROM deployments d2
          WHERE d2.qr_id = "Deployment"."qr_id"
            AND d2.action_type = 'unassign'
            AND d2.action_date > "Deployment"."action_date"
        )`),
      },
      order: [["actionDate", "DESC"]],
    });
  }
}
