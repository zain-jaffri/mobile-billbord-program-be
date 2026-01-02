import { Request, Response } from "express";
import { DriverService } from "./driver.service";
import { RequestWithUser } from "../../shared/middleware/requestContext";

// HTTP layer: translate requests into service calls.
export class DriverController {
  constructor(private readonly driverService: DriverService) {}

  public createDriver = async (req: RequestWithUser, res: Response): Promise<void> => {
    const createdBy = req.user?.username ?? null;
    const { body } = req;

    // Map request body into service payloads.
    const result = await this.driverService.createDriverWithVehicle({
      driver: {
        firstName: body.firstName,
        lastName: body.lastName ?? null,
        licenseState: body.licenseState ?? null,
        licenseNumber: body.licenseNumber ?? null,
        signupDate: body.signupDate,
        phone: body.phone ?? null,
        email: body.email ?? null,
        preferredLanguage: body.preferredLanguage ?? null,
        address: body.address ?? null,
        city: body.city ?? null,
        state: body.state ?? null,
        zip: body.zip ?? null,
        notes: body.notes ?? null,
        referredBy: body.referredBy ?? null,
        isSignedContract: body.isSignedContract ?? false,
        isInactive: body.isInactive ?? false,
        createdBy,
      },
      vehicle: {
        plateNumber: body.vehicle.plateNumber ?? null,
        state: body.vehicle.state ?? null,
        make: body.vehicle.make ?? null,
        model: body.vehicle.model ?? null,
        year: body.vehicle.year ?? null,
        vin: body.vehicle.vin ?? null,
        color: body.vehicle.color ?? null,
        notes: body.vehicle.notes ?? null,
        createdBy,
      },
      deployment: body.deployment
        ? {
            qrId: body.deployment.qrId,
            actionDate: body.deployment.actionDate,
            notes: body.deployment.notes ?? null,
          }
        : undefined,
      odometer: body.odometer
        ? {
            readingDate: body.odometer.readingDate,
            mileage: body.odometer.mileage,
            notes: body.odometer.notes ?? null,
          }
        : undefined,
    });

    res.status(201).json({
      driverId: result.driver.getDataValue("driverId"),
      vehicleId: result.vehicle.getDataValue("vehicleId"),
    });
  };

  public returningDriver = async (req: RequestWithUser, res: Response): Promise<void> => {
    const createdBy = req.user?.username ?? null;
    const { body } = req;

    await this.driverService.processReturningDriver({
      driverId: body.driverId,
      vehicleId: body.vehicleId,
      phone: body.phone ?? null,
      email: body.email ?? null,
      plateNumber: body.plateNumber ?? null,
      qrId: body.qrId ?? null,
      eventDate: body.eventDate,
      mileage: body.mileage,
      driverNotes: body.driverNotes ?? null,
      vehicleNotes: body.vehicleNotes ?? null,
      deploymentNotes: body.deploymentNotes ?? null,
      odometerNotes: body.odometerNotes ?? null,
      createdBy,
    });

    res.status(200).json({ status: "ok" });
  };

  public updateDriver = async (req: RequestWithUser, res: Response): Promise<void> => {
    const createdBy = req.user?.username ?? null;
    const { body, params } = req;

    const driver = await this.driverService.updateDriver(Number(params.driverId), {
      firstName: body.firstName,
      lastName: body.lastName ?? null,
      phone: body.phone ?? null,
      email: body.email ?? null,
      address: body.address ?? null,
      city: body.city ?? null,
      state: body.state ?? null,
      zip: body.zip ?? null,
      notes: body.notes ?? null,
      signupDate: body.signupDate,
      licenseState: body.licenseState ?? null,
      licenseNumber: body.licenseNumber ?? null,
      preferredLanguage: body.preferredLanguage ?? null,
      referredBy: body.referredBy ?? null,
      isSignedContract: body.isSignedContract ?? false,
      isInactive: body.isInactive ?? false,
      createdBy,
    });

    res.status(200).json({ driverId: driver.driverId });
  };

  public listDrivers = async (_req: Request, res: Response): Promise<void> => {
    const drivers = await this.driverService.listDriversWithActiveQrCounts();
    res.status(200).json(drivers);
  };

  public getDriverDetail = async (req: Request, res: Response): Promise<void> => {
    const detail = await this.driverService.getDriverDetail(Number(req.params.driverId));
    res.status(200).json(detail);
  };

  public searchDrivers = async (req: Request, res: Response): Promise<void> => {
    const drivers = await this.driverService.searchDrivers({
      q: typeof req.query.q === "string" ? req.query.q : "",
      vehicleId: req.query.vehicleId ? Number(req.query.vehicleId) : undefined,
    });
    res.status(200).json(drivers);
  };

  public listDriverSubmissions = async (req: Request, res: Response): Promise<void> => {
    const driverId = Number(req.params.driverId);
    const submissions = await this.driverService.listDriverMonthlySubmissions(driverId);
    res.status(200).json(submissions);
  };

  public deleteDriver = async (req: Request, res: Response): Promise<void> => {
    await this.driverService.deleteDriver(Number(req.params.driverId));
    res.status(204).send();
  };
}
