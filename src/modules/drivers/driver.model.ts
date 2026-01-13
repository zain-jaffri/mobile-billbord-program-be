import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../shared/sequelize";
import type { Vehicle } from "../vehicles/vehicle.model";
import type { Payment } from "../payments/payment.model";

// Sequelize model aligned to drivers table.
export type DriverAttributes = {
  driverId: number;
  firstName: string;
  lastName?: string | null;
  licenseState?: string | null;
  licenseNumber?: string | null;
  signupDate: Date;
  phone?: string | null;
  email?: string | null;
  preferredLanguage?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  notes?: string | null;
  referredBy?: number | null;
  isSignedContract: boolean;
  isInactive: boolean;
  createdBy?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
};

export type DriverCreation = Optional<
  DriverAttributes,
  | "driverId"
  | "lastName"
  | "licenseState"
  | "licenseNumber"
  | "phone"
  | "email"
  | "preferredLanguage"
  | "address"
  | "city"
  | "state"
  | "zip"
  | "notes"
  | "referredBy"
  | "createdBy"
  | "createdAt"
  | "updatedAt"
>;

export class Driver extends Model<DriverAttributes, DriverCreation> implements DriverAttributes {
  declare driverId: number;
  declare firstName: string;
  declare lastName: string | null;
  declare licenseState: string | null;
  declare licenseNumber: string | null;
  declare signupDate: Date;
  declare phone: string | null;
  declare email: string | null;
  declare preferredLanguage: string | null;
  declare address: string | null;
  declare city: string | null;
  declare state: string | null;
  declare zip: string | null;
  declare notes: string | null;
  declare referredBy: number | null;
  declare isSignedContract: boolean;
  declare isInactive: boolean;
  declare createdBy: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare readonly Vehicles?: Vehicle[];
  declare readonly Payments?: Payment[];
}

// Field mapping mirrors the MariaDB schema (lengths, nullability, defaults).
Driver.init(
  {
    driverId: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      field: "driver_id",
    },
    firstName: { type: DataTypes.STRING(50), allowNull: false, field: "first_name" },
    lastName: { type: DataTypes.STRING(50), allowNull: true, field: "last_name" },
    licenseState: { type: DataTypes.CHAR(2), allowNull: true, field: "license_state" },
    licenseNumber: { type: DataTypes.STRING(50), allowNull: true, field: "license_number" },
    signupDate: { type: DataTypes.DATEONLY, allowNull: false, field: "signup_date" },
    phone: { type: DataTypes.STRING(20), allowNull: true },
    email: { type: DataTypes.STRING(100), allowNull: true },
    preferredLanguage: { type: DataTypes.STRING(50), allowNull: true, field: "preferred_language" },
    address: { type: DataTypes.STRING(200), allowNull: true },
    city: { type: DataTypes.STRING(100), allowNull: true },
    state: { type: DataTypes.CHAR(2), allowNull: true },
    zip: { type: DataTypes.STRING(10), allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    referredBy: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, field: "referred_by" },
    isSignedContract: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: "is_signed_contract" },
    isInactive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: "is_inactive" },
    createdBy: { type: DataTypes.STRING(50), allowNull: true, field: "created_by" },
  },
  {
    sequelize,
    tableName: "drivers",
    underscored: true,
    indexes: [{ fields: ["referred_by"] }],
  }
);
