import { z } from "zod";

// Input validation for deployment endpoints.
export const createDeploymentSchema = z.object({
  body: z.object({
    vehicleId: z.coerce.number().int().positive(),
    qrId: z.coerce.number().int().positive(),
    actionType: z.enum(["assign", "unassign"]),
    actionDate: z.coerce.date(),
    notes: z.string().optional().nullable(),
    createdBy: z.string().optional().nullable(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const updateDeploymentSchema = z.object({
  body: z.object({
    vehicleId: z.coerce.number().int().positive(),
    qrId: z.coerce.number().int().positive(),
    actionType: z.enum(["assign", "unassign"]),
    actionDate: z.coerce.date(),
    notes: z.string().optional().nullable(),
    createdBy: z.string().optional().nullable(),
  }),
  params: z.object({
    deploymentId: z.coerce.number().int().positive(),
  }),
  query: z.object({}).optional(),
});

export const deploymentIdParamSchema = z.object({
  params: z.object({
    deploymentId: z.coerce.number().int().positive(),
  }),
  body: z.object({}).optional(),
  query: z.object({}).optional(),
});
