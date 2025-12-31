import { Request, Response } from "express";
import { DeploymentService } from "./deployment.service";
import { RequestWithUser } from "../../shared/middleware/requestContext";

// HTTP layer for deployment endpoints.
export class DeploymentController {
  constructor(private readonly deploymentService: DeploymentService) {}

  public createDeployment = async (req: RequestWithUser, res: Response): Promise<void> => {
    const createdBy = req.user?.username ?? null;
    const deployment = await this.deploymentService.createDeployment({
      vehicleId: req.body.vehicleId,
      qrId: req.body.qrId,
      actionType: req.body.actionType,
      actionDate: req.body.actionDate,
      notes: req.body.notes ?? null,
      createdBy,
    });

    res.status(201).json({ deploymentId: deployment.deploymentId });
  };

  public updateDeployment = async (req: RequestWithUser, res: Response): Promise<void> => {
    const createdBy = req.user?.username ?? null;
    const deployment = await this.deploymentService.updateDeployment(Number(req.params.deploymentId), {
      vehicleId: req.body.vehicleId,
      qrId: req.body.qrId,
      actionType: req.body.actionType,
      actionDate: req.body.actionDate,
      notes: req.body.notes ?? null,
      createdBy,
    });

    res.status(200).json({ deploymentId: deployment.deploymentId });
  };

  public deleteDeployment = async (req: Request, res: Response): Promise<void> => {
    await this.deploymentService.deleteDeployment(Number(req.params.deploymentId));
    res.status(204).send();
  };

  public getDeployment = async (req: Request, res: Response): Promise<void> => {
    const deployment = await this.deploymentService.getDeploymentDetail(Number(req.params.deploymentId));
    // Also return computed active status for the UI.
    const isActive = await this.deploymentService.isDeploymentActive(Number(req.params.deploymentId));
    res.status(200).json({ deployment, isActive });
  };

  public listDeployments = async (_req: Request, res: Response): Promise<void> => {
    const deployments = await this.deploymentService.listDeployments();
    res.status(200).json(deployments);
  };
}
