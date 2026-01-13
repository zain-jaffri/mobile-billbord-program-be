import { Op, Sequelize } from "sequelize";
import { QRCode } from "./qrCode.model";
import { Deployment } from "../deployments/deployment.model";
import { Vehicle } from "../vehicles/vehicle.model";
import { FormSubmission } from "../submissions/submission.model";
import { DeploymentService } from "../deployments/deployment.service";
import { notFound } from "../../shared/errors";

// QR code domain logic: listings, details, and active deployment info.
export class QRCodeService {
  constructor(
    private readonly models: {
      QRCode: typeof QRCode;
      Deployment: typeof Deployment;
      Vehicle: typeof Vehicle;
      FormSubmission: typeof FormSubmission;
    },
    private readonly deploymentService: DeploymentService
  ) {}

  public async createQr(payload: {
    externalId?: string | null;
    codeValue: string;
    source?: "local" | "qrio";
    lastSynced?: Date | null;
    notes?: string | null;
    createdBy?: string | null;
  }): Promise<QRCode> {
    return this.models.QRCode.create(payload);
  }

  public async updateQr(qrId: number, payload: {
    externalId?: string | null;
    codeValue: string;
    source?: "local" | "qrio";
    lastSynced?: Date | null;
    notes?: string | null;
    createdBy?: string | null;
  }): Promise<QRCode> {
    const qr = await this.models.QRCode.findByPk(qrId);
    if (!qr) {
      throw notFound("QR code not found");
    }
    await qr.update(payload);
    return qr;
  }

  public async deleteQr(qrId: number): Promise<void> {
    const qr = await this.models.QRCode.findByPk(qrId);
    if (!qr) {
      throw notFound("QR code not found");
    }
    await qr.destroy();
  }

  public async listQrsWithActiveDeployment(): Promise<Array<QRCode & { activeDeploymentId?: number | null }>> {
    const qrs = await this.models.QRCode.findAll({ order: [["externalId", "ASC"]] });

    const results: Array<QRCode & { activeDeploymentId?: number | null }> = [];
    for (const qr of qrs) {
      const active = await this.deploymentService.getActiveDeploymentForQr(qr.qrId);
      results.push(Object.assign(qr, { activeDeploymentId: active?.deploymentId ?? null }));
    }

    return results;
  }

  public async getQrDetail(qrId: number): Promise<{
    qr: QRCode;
    deployments: Deployment[];
    submissions: FormSubmission[];
  }> {
    const qr = await this.models.QRCode.findByPk(qrId);
    if (!qr) {
      throw notFound("QR code not found");
    }

    const deployments = await this.models.Deployment.findAll({
      where: { qrId },
      include: [{ model: this.models.Vehicle }],
      order: [["actionDate", "DESC"]],
    });

    const submissions = await this.models.FormSubmission.findAll({
      where: { qrId },
      order: [["submissionDate", "DESC"]],
    });

    return { qr, deployments, submissions };
  }

  public async searchQrs(query: { q: string }): Promise<QRCode[]> {
    const q = query.q;
    return this.models.QRCode.findAll({
      where: {
        [Op.or]: [
          Sequelize.where(Sequelize.cast(Sequelize.col("qr_id"), "CHAR"), {
            [Op.like]: `%${q}%`,
          }),
          { externalId: { [Op.like]: `%${q}%` } },
          { codeValue: { [Op.like]: `%${q}%` } },
        ],
      },
      order: [["qrId", "DESC"]],
      limit: 10,
    });
  }
}
