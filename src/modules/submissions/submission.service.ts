import { FormSubmission } from "./submission.model";
import { QRCode } from "../qrCodes/qrCode.model";
import { Deployment } from "../deployments/deployment.model";
import { Vehicle } from "../vehicles/vehicle.model";
import { Driver } from "../drivers/driver.model";
import { DeploymentService } from "../deployments/deployment.service";
import { notFound } from "../../shared/errors";

// Submission domain logic, including active driver resolution via QR deployments.
export class SubmissionService {
  constructor(
    private readonly models: {
      FormSubmission: typeof FormSubmission;
      QRCode: typeof QRCode;
      Deployment: typeof Deployment;
      Vehicle: typeof Vehicle;
      Driver: typeof Driver;
    },
    private readonly deploymentService: DeploymentService
  ) {}

  public async createSubmission(payload: {
    qrId?: number | null;
    source?: string;
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
    createdBy?: string | null;
  }): Promise<FormSubmission> {
    return this.models.FormSubmission.create({
      ...payload,
      source: payload.source ?? "main",
      createdBy: payload.createdBy ?? "automatic",
      submissionDate: new Date(),
    });
  }

  public async listSubmissions(): Promise<Array<FormSubmission & { qr?: QRCode | null; driver?: Driver | null }>> {
    const submissions = await this.models.FormSubmission.findAll({
      order: [["submissionDate", "DESC"]],
    });

    const results: Array<FormSubmission & { qr?: QRCode | null; driver?: Driver | null }> = [];
    for (const submission of submissions) {
      const qr = submission.qrId ? await this.models.QRCode.findByPk(submission.qrId) : null;
      let driver: Driver | null = null;
      if (submission.qrId) {
        // Active deployment provides the current driver for a QR.
        const activeDeployment = await this.deploymentService.getActiveDeploymentForQr(submission.qrId);
        if (activeDeployment) {
          const vehicle = await this.models.Vehicle.findByPk(activeDeployment.vehicleId, {
            include: [this.models.Driver],
          });
          driver = vehicle?.Driver ?? null;
        }
      }
      results.push(Object.assign(submission, { qr, driver }));
    }

    return results;
  }

  public async getSubmissionDetail(submissionId: number): Promise<FormSubmission & { qr?: QRCode | null }> {
    const submission = await this.models.FormSubmission.findByPk(submissionId, {
      include: [this.models.QRCode],
    });

    if (!submission) {
      throw notFound("Submission not found");
    }

    return submission;
  }

  public async deleteSubmission(submissionId: number): Promise<void> {
    const submission = await this.models.FormSubmission.findByPk(submissionId);
    if (!submission) {
      throw notFound("Submission not found");
    }
    await submission.destroy();
  }

  public async assignQr(submissionId: number, qrId: number): Promise<void> {
    const submission = await this.models.FormSubmission.findByPk(submissionId);
    if (!submission) {
      throw notFound("Submission not found");
    }
    await submission.update({ qrId });
  }
}
