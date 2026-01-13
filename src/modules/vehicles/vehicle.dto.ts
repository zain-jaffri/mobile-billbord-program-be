import { z } from "zod";

// Input validation for vehicle endpoints.
export const createVehicleSchema = z.object({
  body: z.object({
    driverId: z.coerce.number().int().positive().optional().nullable(),
    plateNumber: z.string().optional().nullable(),
    state: z.string().optional().nullable(),
    make: z.string().optional().nullable(),
    model: z.string().optional().nullable(),
    year: z.coerce.number().int().positive().optional().nullable(),
    vin: z.string().optional().nullable(),
    color: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    createdBy: z.string().optional().nullable(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const updateVehicleSchema = z.object({
  params: z.object({
    vehicleId: z.coerce.number().int().positive(),
  }),
  body: z.object({
    driverId: z.coerce.number().int().positive().optional().nullable(),
    plateNumber: z.string().optional().nullable(),
    state: z.string().optional().nullable(),
    make: z.string().optional().nullable(),
    model: z.string().optional().nullable(),
    year: z.coerce.number().int().positive().optional().nullable(),
    vin: z.string().optional().nullable(),
    color: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    createdBy: z.string().optional().nullable(),
  }),
  query: z.object({}).optional(),
});

export const vehicleIdParamSchema = z.object({
  params: z.object({
    vehicleId: z.coerce.number().int().positive(),
  }),
  body: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const searchVehiclesSchema = z.object({
  query: z.object({
    q: z.string().optional().default(""),
    driverId: z.coerce.number().int().positive().optional(),
  }),
  params: z.object({}).optional(),
  body: z.object({}).optional(),
});
