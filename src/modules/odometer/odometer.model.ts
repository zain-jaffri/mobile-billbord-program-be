import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../shared/sequelize";
import type { Vehicle } from "../vehicles/vehicle.model";

// Sequelize model aligned to odometer_readings table.
export type OdometerAttributes = {
  readingId: number;
  vehicleId: number;
  readingDate: Date;
  mileage: number;
  notes?: string | null;
  createdBy?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
};

export type OdometerCreation = Optional<
  OdometerAttributes,
  "readingId" | "notes" | "createdBy" | "createdAt" | "updatedAt"
>;

export class OdometerReading extends Model<OdometerAttributes, OdometerCreation> implements OdometerAttributes {
  public readingId!: number;
  public vehicleId!: number;
  public readingDate!: Date;
  public mileage!: number;
  public notes!: string | null;
  public createdBy!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly Vehicle?: Vehicle;
}

// Field mapping mirrors the MariaDB schema (lengths, nullability, defaults).
OdometerReading.init(
  {
    readingId: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      field: "reading_id",
    },
    vehicleId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: "vehicle_id" },
    readingDate: { type: DataTypes.DATEONLY, allowNull: false, field: "reading_date" },
    mileage: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    notes: { type: DataTypes.TEXT, allowNull: true },
    createdBy: { type: DataTypes.STRING(50), allowNull: true, field: "created_by" },
  },
  {
    sequelize,
    tableName: "odometer_readings",
    underscored: true,
    indexes: [{ fields: ["vehicle_id"] }],
  }
);
