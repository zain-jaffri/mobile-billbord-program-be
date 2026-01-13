import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../shared/sequelize";
import type { Driver } from "../drivers/driver.model";
import type { Deployment } from "../deployments/deployment.model";
import type { OdometerReading } from "../odometer/odometer.model";

// Sequelize model aligned to vehicles table.
export type VehicleAttributes = {
  vehicleId: number;
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
  createdAt?: Date;
  updatedAt?: Date;
};

export type VehicleCreation = Optional<
  VehicleAttributes,
  | "vehicleId"
  | "driverId"
  | "plateNumber"
  | "state"
  | "make"
  | "model"
  | "year"
  | "vin"
  | "color"
  | "notes"
  | "createdBy"
  | "createdAt"
  | "updatedAt"
>;

export class Vehicle extends Model<VehicleAttributes, VehicleCreation> implements VehicleAttributes {
  declare vehicleId: number;
  declare driverId: number | null;
  declare plateNumber: string | null;
  declare state: string | null;
  declare make: string | null;
  declare model: string | null;
  declare year: number | null;
  declare vin: string | null;
  declare color: string | null;
  declare notes: string | null;
  declare createdBy: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare readonly Driver?: Driver;
  declare readonly Deployments?: Deployment[];
  declare readonly OdometerReadings?: OdometerReading[];
}

// Field mapping mirrors the MariaDB schema (lengths, nullability, defaults).
Vehicle.init(
  {
    vehicleId: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      field: "vehicle_id",
    },
    driverId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, field: "driver_id" },
    plateNumber: { type: DataTypes.STRING(20), allowNull: true, field: "plate_number" },
    state: { type: DataTypes.CHAR(2), allowNull: true },
    make: { type: DataTypes.STRING(50), allowNull: true },
    model: { type: DataTypes.STRING(50), allowNull: true },
    year: { type: DataTypes.INTEGER, allowNull: true },
    vin: { type: DataTypes.STRING(50), allowNull: true },
    color: { type: DataTypes.STRING(30), allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    createdBy: { type: DataTypes.STRING(50), allowNull: true, field: "created_by" },
  },
  {
    sequelize,
    tableName: "vehicles",
    underscored: true,
    indexes: [{ fields: ["driver_id"] }],
  }
);
