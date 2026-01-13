import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../shared/sequelize";
import type { MonthlySubmission } from "./monthlySubmission.model";

export type SubmissionPhotoType = "front" | "back" | "left" | "right" | "odometer";

export type MonthlySubmissionPhotoAttributes = {
  photoId: number;
  submissionId: number;
  photoType: SubmissionPhotoType;
  storagePath: string;
  uploadedAt?: Date;
};

export type MonthlySubmissionPhotoCreation = Optional<
  MonthlySubmissionPhotoAttributes,
  "photoId" | "uploadedAt"
>;

export class MonthlySubmissionPhoto
  extends Model<MonthlySubmissionPhotoAttributes, MonthlySubmissionPhotoCreation>
  implements MonthlySubmissionPhotoAttributes
{
  declare photoId: number;
  declare submissionId: number;
  declare photoType: SubmissionPhotoType;
  declare storagePath: string;
  declare uploadedAt: Date;
  declare readonly Submission?: MonthlySubmission;
}

MonthlySubmissionPhoto.init(
  {
    photoId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: "photo_id",
    },
    submissionId: { type: DataTypes.INTEGER, allowNull: false, field: "submission_id" },
    photoType: {
      type: DataTypes.ENUM("front", "back", "left", "right", "odometer"),
      allowNull: false,
      field: "photo_type",
    },
    storagePath: { type: DataTypes.TEXT, allowNull: false, field: "storage_path" },
    uploadedAt: { type: DataTypes.DATE, allowNull: true, field: "uploaded_at" },
  },
  {
    sequelize,
    tableName: "driver_monthly_submission_photos",
    underscored: true,
    timestamps: false,
    indexes: [{ fields: ["submission_id"] }, { fields: ["photo_type"] }],
  }
);
