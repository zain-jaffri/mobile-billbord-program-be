import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../shared/sequelize";
import type { QRCode } from "../qrCodes/qrCode.model";

// Sequelize model aligned to form_submissions table.
export type SubmissionAttributes = {
  submissionId: number;
  qrId?: number | null;
  source: string;
  externalId?: string | null;
  respondentId?: string | null;
  firstName: string;
  lastName?: string | null;
  phone: string;
  email?: string | null;
  beenAccident: boolean;
  consentSms: boolean;
  ipAddress?: string | null;
  notes?: string | null;
  submissionDate: Date;
  createdBy?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
};

export type SubmissionCreation = Optional<
  SubmissionAttributes,
  | "submissionId"
  | "qrId"
  | "externalId"
  | "lastName"
  | "email"
  | "respondentId"
  | "ipAddress"
  | "notes"
  | "createdBy"
  | "createdAt"
  | "updatedAt"
>;

export class FormSubmission extends Model<SubmissionAttributes, SubmissionCreation> implements SubmissionAttributes {
  public submissionId!: number;
  public qrId!: number | null;
  public source!: string;
  public externalId!: string | null;
  public respondentId!: string | null;
  public firstName!: string;
  public lastName!: string | null;
  public phone!: string;
  public email!: string | null;
  public beenAccident!: boolean;
  public consentSms!: boolean;
  public ipAddress!: string | null;
  public notes!: string | null;
  public submissionDate!: Date;
  public createdBy!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly QRCode?: QRCode;
}

// Field mapping mirrors the MariaDB schema (lengths, nullability, defaults).
FormSubmission.init(
  {
    submissionId: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      field: "submission_id",
    },
    source: { type: DataTypes.STRING(20), allowNull: false, defaultValue: "main" },
    externalId: { type: DataTypes.STRING(100), allowNull: true, field: "external_id" },
    respondentId: { type: DataTypes.STRING(100), allowNull: true, field: "respondent_id" },
    qrId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, field: "qr_id" },
    submissionDate: { type: DataTypes.DATE, allowNull: false, field: "submission_date" },
    firstName: { type: DataTypes.STRING(100), allowNull: false, field: "first_name" },
    lastName: { type: DataTypes.STRING(100), allowNull: true, field: "last_name" },
    phone: { type: DataTypes.STRING(20), allowNull: false },
    email: { type: DataTypes.STRING(100), allowNull: true },
    beenAccident: { type: DataTypes.BOOLEAN, allowNull: false, field: "been_accident" },
    consentSms: { type: DataTypes.BOOLEAN, allowNull: false, field: "consent_sms" },
    ipAddress: { type: DataTypes.STRING(45), allowNull: true, field: "ip_address" },
    notes: { type: DataTypes.TEXT, allowNull: true },
    createdBy: { type: DataTypes.STRING(50), allowNull: false, defaultValue: "automatic", field: "created_by" },
  },
  {
    sequelize,
    tableName: "form_submissions",
    underscored: true,
    indexes: [{ fields: ["qr_id"] }],
  }
);
