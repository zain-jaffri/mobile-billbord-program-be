import { Transaction, Op, Sequelize } from "sequelize";
import { sequelize } from "../../shared/sequelize";
import { Driver, DriverCreation } from "./driver.model";
import { Vehicle, VehicleCreation } from "../vehicles/vehicle.model";
import { Deployment } from "../deployments/deployment.model";
import { OdometerReading } from "../odometer/odometer.model";
import { FormSubmission } from "../submissions/submission.model";
import { Payment } from "../payments/payment.model";
import { MonthlySubmission } from "../monthlySubmissions/monthlySubmission.model";
import { MonthlySubmissionPhoto } from "../monthlySubmissions/monthlySubmissionPhoto.model";
import { DeploymentService } from "../deployments/deployment.service";
import { notFound } from "../../shared/errors";
import { notifyZapierNewDriver } from "../../shared/utils/zapier";
import { getCurrentPeriodStart } from "../../shared/utils/monthlyPeriod";

// Business logic for driver flows and cross-domain orchestration.
export class DriverService {
  constructor(
    private readonly models: {
      Driver: typeof Driver;
      Vehicle: typeof Vehicle;
      Deployment: typeof Deployment;
      OdometerReading: typeof OdometerReading;
      FormSubmission: typeof FormSubmission;
      Payment: typeof Payment;
      MonthlySubmission: typeof MonthlySubmission;
      MonthlySubmissionPhoto: typeof MonthlySubmissionPhoto;
    },
    private readonly deploymentService: DeploymentService
  ) {}

  // Example transaction: new driver workflow.
  public async createDriverWithVehicle(payload: {
    driver: DriverCreation;
    vehicle: VehicleCreation;
    deployment?: { qrId: number; actionDate: Date; notes?: string | null };
    odometer?: { readingDate: Date; mileage: number; notes?: string | null };
  }): Promise<{ driver: Driver; vehicle: Vehicle }> {
    const { driver, vehicle, deployment, odometer } = payload;

    // Single transaction ensures driver/vehicle/deployment/odometer are consistent.
    const result = await sequelize.transaction(async (transaction) => {
      const createdDriver = await this.models.Driver.create(driver, { transaction });
      const driverId = createdDriver.getDataValue("driverId");
      const createdVehicle = await this.models.Vehicle.create(
        { ...vehicle, driverId },
        { transaction }
      );
      const vehicleId = createdVehicle.getDataValue("vehicleId");

      if (deployment) {
        await this.deploymentService.createDeployment(
          {
            vehicleId,
            qrId: deployment.qrId,
            actionType: "assign",
            actionDate: deployment.actionDate,
            notes: deployment.notes ?? null,
            createdBy: driver.createdBy ?? null,
          },
          transaction
        );
      }

      if (odometer) {
        await this.models.OdometerReading.create(
          {
            vehicleId,
            readingDate: odometer.readingDate,
            mileage: odometer.mileage,
            notes: odometer.notes ?? null,
            createdBy: driver.createdBy ?? null,
          },
          { transaction }
        );
      }

      return { driver: createdDriver, vehicle: createdVehicle };
    });

    if (result.driver.email) {
      // Zapier is only called after the transaction commits successfully.
      await notifyZapierNewDriver({
        name: `${result.driver.firstName} ${result.driver.lastName ?? ""}`.trim(),
        email: result.driver.email,
        driverId: result.driver.driverId,
      });
    }

    return result;
  }

  // Returning driver workflow with "update only if changed" logic.
  public async processReturningDriver(payload: {
    driverId: number;
    vehicleId: number;
    phone?: string | null;
    email?: string | null;
    plateNumber?: string | null;
    qrId?: number | null;
    eventDate: Date;
    mileage: number;
    driverNotes?: string | null;
    vehicleNotes?: string | null;
    deploymentNotes?: string | null;
    odometerNotes?: string | null;
    createdBy?: string | null;
  }): Promise<void> {
    await sequelize.transaction(async (transaction) => {
      const driver = await this.models.Driver.findByPk(payload.driverId, { transaction });
      const vehicle = await this.models.Vehicle.findByPk(payload.vehicleId, { transaction });

      if (!driver || !vehicle) {
        throw notFound("Driver or vehicle not found");
      }

      // Only update when changes are present to reduce writes.
      const shouldUpdateDriver =
        (payload.phone && payload.phone !== driver.phone) ||
        (payload.email && payload.email !== driver.email) ||
        (payload.driverNotes && payload.driverNotes !== driver.notes);

      if (shouldUpdateDriver) {
        await driver.update(
          {
            phone: payload.phone ?? driver.phone,
            email: payload.email ?? driver.email,
            notes: payload.driverNotes ?? driver.notes,
          },
          { transaction }
        );
      }

      const shouldUpdateVehicle =
        (payload.plateNumber && payload.plateNumber !== vehicle.plateNumber) ||
        (payload.vehicleNotes && payload.vehicleNotes !== vehicle.notes);

      if (shouldUpdateVehicle) {
        await vehicle.update(
          {
            plateNumber: payload.plateNumber ?? vehicle.plateNumber,
            notes: payload.vehicleNotes ?? vehicle.notes,
          },
          { transaction }
        );
      }

      // Optional deployment event for returning drivers.
      if (payload.qrId) {
        await this.deploymentService.createDeployment(
          {
            vehicleId: vehicle.vehicleId,
            qrId: payload.qrId,
            actionType: "assign",
            actionDate: payload.eventDate,
            notes: payload.deploymentNotes ?? null,
            createdBy: payload.createdBy ?? null,
          },
          transaction
        );
      }

      // Always append odometer readings (historical).
      await this.models.OdometerReading.create(
        {
          vehicleId: vehicle.vehicleId,
          readingDate: payload.eventDate,
          mileage: payload.mileage,
          notes: payload.odometerNotes ?? null,
          createdBy: payload.createdBy ?? null,
        },
        { transaction }
      );
    });
  }

  // Example transaction: deactivate driver with cascade unassignments.
  public async updateDriver(driverId: number, payload: {
    firstName: string;
    lastName?: string | null;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    zip?: string | null;
    notes?: string | null;
    signupDate: Date;
    licenseState?: string | null;
    licenseNumber?: string | null;
    preferredLanguage?: string | null;
    referredBy?: number | null;
    isSignedContract: boolean;
    isInactive: boolean;
    createdBy?: string | null;
  }): Promise<Driver> {
    return sequelize.transaction(async (transaction) => {
      const driver = await this.models.Driver.findByPk(driverId, { transaction });
      if (!driver) {
        throw notFound("Driver not found");
      }

      const wasInactive = driver.isInactive;
      const willBeInactive = payload.isInactive;

      // Flip to inactive triggers cascade unassignments.
      if (!wasInactive && willBeInactive) {
        await this.deactivateDriver(driverId, payload.createdBy ?? null, transaction);
      }

      await driver.update(
        {
          ...payload,
        },
        { transaction }
      );

      return driver;
    });
  }

  public async deactivateDriver(driverId: number, createdBy: string | null, transaction?: Transaction): Promise<void> {
    const vehicles = await this.models.Vehicle.findAll({
      where: { driverId },
      transaction,
    });

    // Append unassign events for any currently assigned QR on each vehicle.
    for (const vehicle of vehicles) {
      const latest = await this.deploymentService.getLatestDeploymentForVehicle(vehicle.vehicleId, transaction);
      if (latest && latest.actionType === "assign") {
        await this.deploymentService.createUnassignForVehicle(vehicle.vehicleId, latest.qrId, createdBy, transaction);
      }
    }
  }

  public async listDriversWithActiveQrCounts(): Promise<
    Array<Record<string, unknown> & { activeQrCount: number; missingMonthlySubmission: boolean }>
  > {
    const drivers = await this.models.Driver.findAll({
      order: [["signupDate", "DESC"]],
    });

    const periodStart = getCurrentPeriodStart();
    const results: Array<Record<string, unknown> & { activeQrCount: number; missingMonthlySubmission: boolean }> = [];
    for (const driver of drivers) {
      const vehicles = await this.models.Vehicle.findAll({ where: { driverId: driver.driverId } });
      let activeCount = 0;
      for (const vehicle of vehicles) {
        const active = await this.deploymentService.listActiveForVehicle(vehicle.vehicleId);
        activeCount += active.length;
      }
      const submission = await this.models.MonthlySubmission.findOne({
        where: { driverId: driver.driverId, periodStart },
      });
      const photoCount = submission
        ? await this.models.MonthlySubmissionPhoto.count({
            where: { submissionId: submission.submissionId },
          })
        : 0;
      const missingMonthlySubmission = !submission || photoCount < 5;
      const plainDriver = driver.get({ plain: true }) as Record<string, unknown>;
      results.push({ ...plainDriver, activeQrCount: activeCount, missingMonthlySubmission });
    }

    return results;
  }

  public async searchDrivers(query: { q?: string; vehicleId?: number }): Promise<Driver[]> {
    if (query.vehicleId) {
      const vehicle = await this.models.Vehicle.findByPk(query.vehicleId);
      if (!vehicle) {
        return [];
      }
      const resolvedDriverId = vehicle.getDataValue("driverId");
      if (!resolvedDriverId) {
        return [];
      }
      return this.models.Driver.findAll({
        where: { driverId: resolvedDriverId },
        order: [["signupDate", "DESC"]],
        limit: 10,
      });
    }

    const q = query.q ?? "";
    return this.models.Driver.findAll({
      where: {
        [Op.or]: [
          Sequelize.where(Sequelize.cast(Sequelize.col("driver_id"), "CHAR"), {
            [Op.like]: `%${q}%`,
          }),
          { firstName: { [Op.like]: `%${q}%` } },
          { lastName: { [Op.like]: `%${q}%` } },
        ],
      },
      order: [["signupDate", "DESC"]],
      limit: 10,
    });
  }

  public async getDriverDetail(driverId: number): Promise<{
    driver: Driver;
    referredBy: Driver | null;
    referredTo: Driver[];
    payments: Payment[];
    vehicles: Array<Vehicle & {
      deployments: Array<Deployment & { submissions: FormSubmission[] }>;
      latestOdometer: OdometerReading | null;
      odometerHistory: OdometerReading[];
    }>;
  }> {
    const driver = await this.models.Driver.findByPk(driverId);
    if (!driver) {
      throw notFound("Driver not found");
    }
    const resolvedDriverId = driver.getDataValue("driverId");

    const referredById = driver.getDataValue("referredBy");
    const referredBy =
      referredById != null
        ? await this.models.Driver.findByPk(referredById)
        : null;

    const referredTo = await this.models.Driver.findAll({
      where: { referredBy: resolvedDriverId },
      order: [["signupDate", "DESC"]],
    });

    const payments = await this.models.Payment.findAll({
      where: { driverId: resolvedDriverId },
      order: [["date", "DESC"]],
    });

    const vehicles = await this.models.Vehicle.findAll({
      where: { driverId: resolvedDriverId },
    });

    const vehicleResults: Array<Vehicle & {
      deployments: Array<Deployment & { submissions: FormSubmission[] }>;
      latestOdometer: OdometerReading | null;
      odometerHistory: OdometerReading[];
    }> = [];

    // Hydrate vehicle details with deployments, submissions, and odometer history.
    for (const vehicle of vehicles) {
      const vehicleId = vehicle.getDataValue("vehicleId");
      const deployments = await this.models.Deployment.findAll({
        where: { vehicleId },
        order: [["actionDate", "DESC"]],
      });

      const deploymentResults: Array<Deployment & { submissions: FormSubmission[] }> = [];
      for (const deployment of deployments) {
        const submissions = await this.models.FormSubmission.findAll({
          where: { qrId: deployment.qrId },
          order: [["submissionDate", "DESC"]],
        });
        deploymentResults.push(Object.assign(deployment, { submissions }));
      }

      const latestOdometer = await this.models.OdometerReading.findOne({
        where: { vehicleId },
        order: [["readingDate", "DESC"]],
      });

      const odometerHistory = await this.models.OdometerReading.findAll({
        where: { vehicleId },
        order: [["readingDate", "DESC"]],
        limit: 5,
      });

      vehicleResults.push(
        Object.assign(vehicle, {
          deployments: deploymentResults,
          latestOdometer,
          odometerHistory,
        })
      );
    }

    return {
      driver,
      referredBy,
      referredTo,
      payments,
      vehicles: vehicleResults,
    };
  }

  public async deleteDriver(driverId: number): Promise<void> {
    const driver = await this.models.Driver.findByPk(driverId);
    if (!driver) {
      throw notFound("Driver not found");
    }
    await sequelize.transaction(async (transaction) => {
      const vehicles = await this.models.Vehicle.findAll({
        where: { driverId },
        transaction,
      });
      const vehicleIds = vehicles.map((vehicle) => vehicle.getDataValue("vehicleId"));

      if (vehicleIds.length) {
        await this.models.Deployment.destroy({ where: { vehicleId: vehicleIds }, transaction });
        await this.models.OdometerReading.destroy({ where: { vehicleId: vehicleIds }, transaction });
        await this.models.Vehicle.destroy({ where: { vehicleId: vehicleIds }, transaction });
      }

      await this.models.Payment.destroy({ where: { driverId }, transaction });
      await this.models.Driver.destroy({ where: { driverId }, transaction });
    });
  }
}
