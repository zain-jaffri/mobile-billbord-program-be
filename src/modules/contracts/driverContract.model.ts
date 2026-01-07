import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../shared/sequelize";
import type { Driver } from "../drivers/driver.model";

export type DriverContractAttributes = {
  contractId: number;
  driverId: number;
  envelopeId: string;
  fileName: string;
  storagePath: string;
  signedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
};

export type DriverContractCreation = Optional<
  DriverContractAttributes,
  "contractId" | "signedAt" | "createdAt" | "updatedAt"
>;

export class DriverContract
  extends Model<DriverContractAttributes, DriverContractCreation>
  implements DriverContractAttributes
{
  declare contractId: number;
  declare driverId: number;
  declare envelopeId: string;
  declare fileName: string;
  declare storagePath: string;
  declare signedAt: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare readonly Driver?: Driver;
}

DriverContract.init(
  {
    contractId: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      field: "contract_id",
    },
    driverId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: "driver_id" },
    envelopeId: { type: DataTypes.STRING(120), allowNull: false, field: "envelope_id" },
    fileName: { type: DataTypes.STRING(255), allowNull: false, field: "file_name" },
    storagePath: { type: DataTypes.STRING(500), allowNull: false, field: "storage_path" },
    signedAt: { type: DataTypes.DATE, allowNull: true, field: "signed_at" },
  },
  {
    sequelize,
    tableName: "driver_contracts",
    underscored: true,
    indexes: [{ unique: true, fields: ["envelope_id"] }, { fields: ["driver_id"] }],
  }
);
