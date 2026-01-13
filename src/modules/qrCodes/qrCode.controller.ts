import { Request, Response } from "express";
import { QRCodeService } from "./qrCode.service";
import { RequestWithUser } from "../../shared/middleware/requestContext";

// HTTP layer for QR code endpoints.
export class QRCodeController {
  constructor(private readonly qrService: QRCodeService) {}

  public createQr = async (req: RequestWithUser, res: Response): Promise<void> => {
    const createdBy = req.user?.username ?? null;
    const qr = await this.qrService.createQr({
      externalId: req.body.externalId ?? null,
      codeValue: req.body.codeValue,
      source: req.body.source ?? "local",
      lastSynced: req.body.lastSynced ?? null,
      notes: req.body.notes ?? null,
      createdBy,
    });

    res.status(201).json({ qrId: qr.qrId });
  };

  public updateQr = async (req: RequestWithUser, res: Response): Promise<void> => {
    const createdBy = req.user?.username ?? null;
    const qr = await this.qrService.updateQr(Number(req.params.qrId), {
      externalId: req.body.externalId ?? null,
      codeValue: req.body.codeValue,
      source: req.body.source ?? "local",
      lastSynced: req.body.lastSynced ?? null,
      notes: req.body.notes ?? null,
      createdBy,
    });

    res.status(200).json({ qrId: qr.qrId });
  };

  public deleteQr = async (req: Request, res: Response): Promise<void> => {
    await this.qrService.deleteQr(Number(req.params.qrId));
    res.status(204).send();
  };

  public listQrs = async (_req: Request, res: Response): Promise<void> => {
    const qrs = await this.qrService.listQrsWithActiveDeployment();
    res.status(200).json(qrs);
  };

  public getQrDetail = async (req: Request, res: Response): Promise<void> => {
    const detail = await this.qrService.getQrDetail(Number(req.params.qrId));
    res.status(200).json(detail);
  };

  public listSubmissionsForQr = async (req: Request, res: Response): Promise<void> => {
    const detail = await this.qrService.getQrDetail(Number(req.params.qrId));
    res.status(200).json(detail.submissions);
  };

  public searchQrs = async (req: Request, res: Response): Promise<void> => {
    const qrs = await this.qrService.searchQrs({ q: String(req.query.q) });
    res.status(200).json(qrs);
  };
}
