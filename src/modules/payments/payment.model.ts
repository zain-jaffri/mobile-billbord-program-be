import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../shared/sequelize";
import type { Driver } from "../drivers/driver.model";

// Sequelize model aligned to payments table.
export type PaymentAttributes = {
  paymentId: number;
  externalId: string;
  externalTransactionId?: string | null;
  externalSource: string;
  accountId?: string | null;
  driverId?: number | null;
  amount: number;
  date: Date;
  description?: string | null;
  notes?: string | null;
  createdBy?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
};

export type PaymentCreation = Optional<
  PaymentAttributes,
  | "paymentId"
  | "externalTransactionId"
  | "accountId"
  | "driverId"
  | "description"
  | "notes"
  | "createdBy"
  | "createdAt"
  | "updatedAt"
>;

export class Payment extends Model<PaymentAttributes, PaymentCreation> implements PaymentAttributes {
  declare paymentId: number;
  declare externalId: string;
  declare externalTransactionId: string | null;
  declare externalSource: string;
  declare accountId: string | null;
  declare driverId: number | null;
  declare amount: number;
  declare date: Date;
  declare description: string | null;
  declare notes: string | null;
  declare createdBy: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare readonly Driver?: Driver;
}

// Field mapping mirrors the MariaDB schema (lengths, nullability, defaults).
Payment.init(
  {
    paymentId: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      field: "payment_id",
    },
    externalId: { type: DataTypes.STRING(100), allowNull: false, field: "external_id" },
    externalTransactionId: { type: DataTypes.STRING(100), allowNull: true, field: "external_transaction_id" },
    externalSource: { type: DataTypes.STRING(50), allowNull: false, defaultValue: "maximus_books", field: "external_source" },
    accountId: { type: DataTypes.STRING(100), allowNull: true, field: "account_id" },
    driverId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, field: "driver_id" },
    amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    description: { type: DataTypes.STRING(255), allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    createdBy: { type: DataTypes.STRING(50), allowNull: false, defaultValue: "sync", field: "created_by" },
  },
  {
    sequelize,
    tableName: "payments",
    underscored: true,
    indexes: [{ fields: ["driver_id"] }],
  }
);
