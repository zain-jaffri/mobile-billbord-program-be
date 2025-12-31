import { Request, Response } from "express";
import { VehicleService } from "./vehicle.service";
import { RequestWithUser } from "../../shared/middleware/requestContext";

// HTTP layer for vehicle endpoints.
export class VehicleController {
  constructor(private readonly vehicleService: VehicleService) {}

  public createVehicle = async (req: RequestWithUser, res: Response): Promise<void> => {
    const createdBy = req.user?.username ?? null;
    const vehicle = await this.vehicleService.createVehicle({
      driverId: req.body.driverId ?? null,
      plateNumber: req.body.plateNumber ?? null,
      state: req.body.state ?? null,
      make: req.body.make ?? null,
      model: req.body.model ?? null,
      year: req.body.year ?? null,
      vin: req.body.vin ?? null,
      color: req.body.color ?? null,
      notes: req.body.notes ?? null,
      createdBy,
    });

    res.status(201).json({ vehicleId: vehicle.vehicleId });
  };

  public updateVehicle = async (req: RequestWithUser, res: Response): Promise<void> => {
    const createdBy = req.user?.username ?? null;
    const vehicle = await this.vehicleService.updateVehicle(Number(req.params.vehicleId), {
      driverId: req.body.driverId ?? null,
      plateNumber: req.body.plateNumber ?? null,
      state: req.body.state ?? null,
      make: req.body.make ?? null,
      model: req.body.model ?? null,
      year: req.body.year ?? null,
      vin: req.body.vin ?? null,
      color: req.body.color ?? null,
      notes: req.body.notes ?? null,
      createdBy,
    });

    res.status(200).json({ vehicleId: vehicle.vehicleId });
  };

  public deleteVehicle = async (req: Request, res: Response): Promise<void> => {
    await this.vehicleService.deleteVehicle(Number(req.params.vehicleId));
    res.status(204).send();
  };

  public listVehicles = async (_req: Request, res: Response): Promise<void> => {
    const vehicles = await this.vehicleService.listVehicles();
    res.status(200).json(vehicles);
  };

  public getVehicleDetail = async (req: Request, res: Response): Promise<void> => {
    const detail = await this.vehicleService.getVehicleDetail(Number(req.params.vehicleId));
    res.status(200).json(detail);
  };

  public listActiveDeployments = async (req: Request, res: Response): Promise<void> => {
    const active = await this.vehicleService.listActiveDeployments(Number(req.params.vehicleId));
    res.status(200).json(active);
  };

  public getLastOdometer = async (req: Request, res: Response): Promise<void> => {
    const reading = await this.vehicleService.getLatestOdometer(Number(req.params.vehicleId));
    res.status(200).json(reading ?? {});
  };

  public searchVehicles = async (req: Request, res: Response): Promise<void> => {
    const vehicles = await this.vehicleService.searchVehicles({
      q: typeof req.query.q === "string" ? req.query.q : "",
      driverId: req.query.driverId ? Number(req.query.driverId) : undefined,
    });
    res.status(200).json(vehicles);
  };
}
