import { Transaction } from "sequelize";
import { MonthlySubmission } from "./monthlySubmission.model";
import { MonthlySubmissionPhoto, SubmissionPhotoType } from "./monthlySubmissionPhoto.model";
import { getCurrentPeriodStart } from "../../shared/utils/monthlyPeriod";
import { uploadToSupabaseStorage } from "../../shared/utils/supabaseStorage";
import { forbidden, notFound } from "../../shared/errors";

const REQUIRED_PHOTO_TYPES: SubmissionPhotoType[] = [
  "front",
  "back",
  "left",
  "right",
  "odometer",
];
const DEFAULT_SUBMISSION_STATUS = "inReview";

export class MonthlySubmissionService {
  constructor(
    private readonly models: {
      MonthlySubmission: typeof MonthlySubmission;
      MonthlySubmissionPhoto: typeof MonthlySubmissionPhoto;
    }
  ) {}

  public async getCurrentStatus(driverId: number) {
    const periodStart = getCurrentPeriodStart();
    const submission = await this.models.MonthlySubmission.findOne({
      where: { driverId, periodStart },
    });

    if (!submission) {
      return {
        periodStart,
        submissionId: null,
        submissionStatus: "noSubmission",
        paidStatus: null,
        photosRequired: REQUIRED_PHOTO_TYPES,
        photosUploaded: [],
        isComplete: false,
      };
    }

    const photos = await this.models.MonthlySubmissionPhoto.findAll({
      where: { submissionId: submission.submissionId },
    });

    const uploadedTypes = photos.map((photo) => photo.photoType);
    const isComplete =
      uploadedTypes.length === REQUIRED_PHOTO_TYPES.length &&
      submission.odometerMileage > 0 &&
      Boolean(submission.odometerDate);

    return {
      periodStart,
      submissionId: submission.submissionId,
      odometerMileage: submission.odometerMileage,
      odometerDate: submission.odometerDate,
      submissionStatus: submission.submissionStatus,
      paidStatus: submission.paidStatus,
      photosRequired: REQUIRED_PHOTO_TYPES,
      photosUploaded: photos.map((photo) => ({
        photoType: photo.photoType,
        storagePath: photo.storagePath,
      })),
      isComplete,
    };
  }

  public async upsertMonthlySubmission(payload: {
    driverId: number;
    odometerMileage: number;
    odometerDate: Date;
    createdBy?: string | null;
  }) {
    const periodStart = getCurrentPeriodStart();
    const existing = await this.models.MonthlySubmission.findOne({
      where: { driverId: payload.driverId, periodStart },
    });

    if (existing) {
      await existing.update({
        odometerMileage: payload.odometerMileage,
        odometerDate: payload.odometerDate,
        submissionStatus: DEFAULT_SUBMISSION_STATUS,
        submittedAt: new Date(),
        createdBy: payload.createdBy ?? null,
      });
      return existing;
    }

    return this.models.MonthlySubmission.create({
      driverId: payload.driverId,
      periodStart,
      odometerMileage: payload.odometerMileage,
      odometerDate: payload.odometerDate,
      submissionStatus: DEFAULT_SUBMISSION_STATUS,
      submittedAt: new Date(),
      createdBy: payload.createdBy ?? null,
    });
  }

  public async uploadPhotos(payload: {
    submissionId: number;
    driverId: number;
    periodStart: Date;
    photos: Array<{
      photoType: SubmissionPhotoType;
      fileName: string;
      contentType: string;
      base64: string;
    }>;
  }, transaction?: Transaction) {
    const submission = await this.models.MonthlySubmission.findByPk(payload.submissionId, {
      transaction,
    });
    if (!submission) {
      throw notFound("Monthly submission not found");
    }
    if (submission.driverId !== payload.driverId) {
      throw forbidden("Cannot upload photos for another driver");
    }

    for (const photo of payload.photos) {
      const safeName = photo.fileName.replace(/[^a-zA-Z0-9.\-_]/g, "_");
      const periodKey = payload.periodStart.toISOString().slice(0, 7);
      const path = `drivers/${payload.driverId}/${periodKey}/${photo.photoType}-${Date.now()}-${safeName}`;
      await uploadToSupabaseStorage(path, photo.base64, photo.contentType);

      const existing = await this.models.MonthlySubmissionPhoto.findOne({
        where: { submissionId: submission.submissionId, photoType: photo.photoType },
        transaction,
      });

      if (existing) {
        await existing.update({ storagePath: path, uploadedAt: new Date() }, { transaction });
      } else {
        await this.models.MonthlySubmissionPhoto.create(
          {
            submissionId: submission.submissionId,
            photoType: photo.photoType,
            storagePath: path,
            uploadedAt: new Date(),
          },
          { transaction }
        );
      }
    }
  }

  public async updateSubmissionStatus(submissionId: number, submissionStatus: "inReview" | "approved") {
    const submission = await this.models.MonthlySubmission.findByPk(submissionId);
    if (!submission) {
      throw notFound("Monthly submission not found");
    }

    await submission.update({ submissionStatus });
    return submission;
  }
}
