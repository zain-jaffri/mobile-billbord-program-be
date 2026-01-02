import { Response } from "express";
import { MonthlySubmissionService } from "./monthlySubmission.service";
import type { RequestWithUser } from "../../shared/middleware/requestContext";
import { badRequest } from "../../shared/errors";
import { getCurrentPeriodStart } from "../../shared/utils/monthlyPeriod";

export class MonthlySubmissionController {
  constructor(private readonly service: MonthlySubmissionService) {}

  public getStatus = async (req: RequestWithUser, res: Response): Promise<void> => {
    const driverId = req.user?.driverId;
    if (!driverId) {
      throw badRequest("Driver mapping missing");
    }

    const status = await this.service.getCurrentStatus(driverId);
    res.status(200).json(status);
  };

  public upsertSubmission = async (req: RequestWithUser, res: Response): Promise<void> => {
    const driverId = req.user?.driverId;
    if (!driverId) {
      throw badRequest("Driver mapping missing");
    }

    const createdBy = req.user?.username ?? null;
    const submission = await this.service.upsertMonthlySubmission({
      driverId,
      odometerMileage: req.body.odometerMileage,
      odometerDate: new Date(req.body.odometerDate),
      createdBy,
    });

    res.status(200).json({
      submissionId: submission.submissionId,
      periodStart: submission.periodStart,
    });
  };

  public uploadPhotos = async (req: RequestWithUser, res: Response): Promise<void> => {
    const driverId = req.user?.driverId;
    if (!driverId) {
      throw badRequest("Driver mapping missing");
    }

    const submissionId = Number(req.params.submissionId);
    await this.service.uploadPhotos({
      submissionId,
      driverId,
      periodStart: getCurrentPeriodStart(),
      photos: req.body.photos,
    });

    res.status(200).json({ status: "ok" });
  };
}
