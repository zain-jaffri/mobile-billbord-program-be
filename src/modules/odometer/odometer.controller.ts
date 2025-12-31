import { Request, Response } from "express";
import { OdometerService } from "./odometer.service";
import { RequestWithUser } from "../../shared/middleware/requestContext";

// HTTP layer for odometer endpoints.
export class OdometerController {
  constructor(private readonly odometerService: OdometerService) {}

  public createReading = async (req: RequestWithUser, res: Response): Promise<void> => {
    const createdBy = req.user?.username ?? null;
    const reading = await this.odometerService.createReading({
      vehicleId: req.body.vehicleId,
      readingDate: req.body.readingDate,
      mileage: req.body.mileage,
      notes: req.body.notes ?? null,
      createdBy,
    });

    res.status(201).json({ readingId: reading.readingId });
  };

  public getReading = async (req: Request, res: Response): Promise<void> => {
    const detail = await this.odometerService.getReadingDetail(Number(req.params.readingId));
    res.status(200).json(detail);
  };

  public updateReading = async (req: RequestWithUser, res: Response): Promise<void> => {
    const createdBy = req.user?.username ?? null;
    const reading = await this.odometerService.updateReading(Number(req.params.readingId), {
      readingDate: req.body.readingDate,
      mileage: req.body.mileage,
      notes: req.body.notes ?? null,
      createdBy,
    });

    res.status(200).json({ readingId: reading.readingId });
  };

  public deleteReading = async (req: Request, res: Response): Promise<void> => {
    await this.odometerService.deleteReading(Number(req.params.readingId));
    res.status(204).send();
  };

  public listReadings = async (_req: Request, res: Response): Promise<void> => {
    const readings = await this.odometerService.listReadings();
    res.status(200).json(readings);
  };
}
