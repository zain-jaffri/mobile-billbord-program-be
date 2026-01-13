import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../shared/sequelize";
import type { Vehicle } from "../vehicles/vehicle.model";
import type { QRCode } from "../qrCodes/qrCode.model";

// Sequelize model aligned to deployments table.
export type DeploymentAction = "assign" | "unassign";

export type DeploymentAttributes = {
  deploymentId: number;
  vehicleId: number;
  qrId: number;
  actionType: DeploymentAction;
  actionDate: Date;
  notes?: string | null;
  createdBy?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
};

export type DeploymentCreation = Optional<
  DeploymentAttributes,
  "deploymentId" | "notes" | "createdBy" | "createdAt" | "updatedAt"
>;

export class Deployment extends Model<DeploymentAttributes, DeploymentCreation> implements DeploymentAttributes {
  declare deploymentId: number;
  declare vehicleId: number;
  declare qrId: number;
  declare actionType: DeploymentAction;
  declare actionDate: Date;
  declare notes: string | null;
  declare createdBy: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare readonly Vehicle?: Vehicle;
  declare readonly QRCode?: QRCode;
}

// Field mapping mirrors the MariaDB schema (lengths, nullability, defaults).
Deployment.init(
  {
    deploymentId: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      field: "deployment_id",
    },
    vehicleId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: "vehicle_id" },
    qrId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: "qr_id" },
    actionType: { type: DataTypes.ENUM("assign", "unassign"), allowNull: false, field: "action_type" },
    actionDate: { type: DataTypes.DATEONLY, allowNull: false, field: "action_date" },
    notes: { type: DataTypes.TEXT, allowNull: true },
    createdBy: { type: DataTypes.STRING(50), allowNull: true, field: "created_by" },
  },
  {
    sequelize,
    tableName: "deployments",
    underscored: true,
    indexes: [{ fields: ["vehicle_id"] }, { fields: ["qr_id"] }],
  }
);
