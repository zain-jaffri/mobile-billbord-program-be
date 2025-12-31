import { Request, Response } from "express";
import { SubmissionService } from "./submission.service";
import { RequestWithUser } from "../../shared/middleware/requestContext";

// HTTP layer for submission endpoints.
export class SubmissionController {
  constructor(private readonly submissionService: SubmissionService) {}

  public createSubmission = async (req: RequestWithUser, res: Response): Promise<void> => {
    const createdBy = req.user?.username ?? null;
    const submission = await this.submissionService.createSubmission({
      qrId: req.body.qrId ?? null,
      source: req.body.source ?? "main",
      externalId: req.body.externalId ?? null,
      respondentId: req.body.respondentId ?? null,
      firstName: req.body.firstName,
      lastName: req.body.lastName ?? null,
      phone: req.body.phone,
      email: req.body.email ?? null,
      beenAccident: req.body.beenAccident,
      consentSms: req.body.consentSms,
      ipAddress: req.ip,
      notes: req.body.notes ?? null,
      createdBy: createdBy ?? "automatic",
    });

    res.status(201).json({ submissionId: submission.submissionId });
  };

  public listSubmissions = async (_req: Request, res: Response): Promise<void> => {
    const submissions = await this.submissionService.listSubmissions();
    res.status(200).json(submissions);
  };

  public getSubmission = async (req: Request, res: Response): Promise<void> => {
    const submission = await this.submissionService.getSubmissionDetail(Number(req.params.submissionId));
    res.status(200).json(submission);
  };

  public deleteSubmission = async (req: Request, res: Response): Promise<void> => {
    await this.submissionService.deleteSubmission(Number(req.params.submissionId));
    res.status(204).send();
  };

  public assignQr = async (req: Request, res: Response): Promise<void> => {
    await this.submissionService.assignQr(Number(req.params.submissionId), req.body.qrId);
    res.status(200).json({ status: "ok" });
  };
}
