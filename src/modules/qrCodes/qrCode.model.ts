import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../shared/sequelize";
import type { Deployment } from "../deployments/deployment.model";
import type { FormSubmission } from "../submissions/submission.model";

// Sequelize model aligned to qr_codes table.
export type QRCodeAttributes = {
  qrId: number;
  externalId?: string | null;
  codeValue: string;
  source?: string | null;
  lastSynced?: Date | null;
  notes?: string | null;
  createdBy?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
};

export type QRCodeCreation = Optional<
  QRCodeAttributes,
  "qrId" | "externalId" | "source" | "lastSynced" | "notes" | "createdBy" | "createdAt" | "updatedAt"
>;

export class QRCode extends Model<QRCodeAttributes, QRCodeCreation> implements QRCodeAttributes {
  declare qrId: number;
  declare externalId: string | null;
  declare codeValue: string;
  declare source: string | null;
  declare lastSynced: Date | null;
  declare notes: string | null;
  declare createdBy: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare readonly Deployments?: Deployment[];
  declare readonly FormSubmissions?: FormSubmission[];
}

// Field mapping mirrors the MariaDB schema (lengths, nullability, defaults).
QRCode.init(
  {
    qrId: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      field: "qr_id",
    },
    externalId: { type: DataTypes.STRING(100), allowNull: true, field: "external_id" },
    codeValue: { type: DataTypes.STRING(255), allowNull: false, field: "code_value" },
    source: { type: DataTypes.ENUM("local", "qrio"), allowNull: true, defaultValue: "local" },
    lastSynced: { type: DataTypes.DATE, allowNull: true, field: "last_synced" },
    notes: { type: DataTypes.TEXT, allowNull: true },
    createdBy: { type: DataTypes.STRING(50), allowNull: true, field: "created_by" },
  },
  {
    sequelize,
    tableName: "qr_codes",
    underscored: true,
    indexes: [],
  }
);
