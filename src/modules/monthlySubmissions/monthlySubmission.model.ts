import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../shared/sequelize";
import type { MonthlySubmissionPhoto } from "./monthlySubmissionPhoto.model";

export type MonthlySubmissionAttributes = {
  submissionId: number;
  driverId: number;
  periodStart: Date;
  odometerMileage: number;
  odometerDate: Date;
  submissionStatus: "inReview" | "approved";
  paidStatus: "unpaid" | "paid";
  submittedAt?: Date;
  createdBy?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
};

export type MonthlySubmissionCreation = Optional<
  MonthlySubmissionAttributes,
  | "submissionId"
  | "submissionStatus"
  | "paidStatus"
  | "submittedAt"
  | "createdBy"
  | "createdAt"
  | "updatedAt"
>;

export class MonthlySubmission
  extends Model<MonthlySubmissionAttributes, MonthlySubmissionCreation>
  implements MonthlySubmissionAttributes
{
  declare submissionId: number;
  declare driverId: number;
  declare periodStart: Date;
  declare odometerMileage: number;
  declare odometerDate: Date;
  declare submissionStatus: "inReview" | "approved";
  declare paidStatus: "unpaid" | "paid";
  declare submittedAt: Date;
  declare createdBy: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare readonly Photos?: MonthlySubmissionPhoto[];
}

MonthlySubmission.init(
  {
    submissionId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: "submission_id",
    },
    driverId: { type: DataTypes.INTEGER, allowNull: false, field: "driver_id" },
    periodStart: { type: DataTypes.DATEONLY, allowNull: false, field: "period_start" },
    odometerMileage: { type: DataTypes.INTEGER, allowNull: false, field: "odometer_mileage" },
    odometerDate: { type: DataTypes.DATEONLY, allowNull: false, field: "odometer_date" },
    submissionStatus: {
      type: DataTypes.ENUM("inReview", "approved"),
      allowNull: false,
      defaultValue: "inReview",
      field: "submission_status",
    },
    paidStatus: {
      type: DataTypes.ENUM("unpaid", "paid"),
      allowNull: false,
      defaultValue: "unpaid",
      field: "paid_status",
    },
    submittedAt: { type: DataTypes.DATE, allowNull: true, field: "submitted_at" },
    createdBy: { type: DataTypes.STRING(255), allowNull: true, field: "created_by" },
  },
  {
    sequelize,
    tableName: "driver_monthly_submissions",
    underscored: true,
    indexes: [{ fields: ["driver_id"] }, { fields: ["period_start"] }],
  }
);
