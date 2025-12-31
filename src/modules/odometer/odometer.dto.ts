import { z } from "zod";

// Input validation for odometer endpoints.
export const createOdometerSchema = z.object({
  body: z.object({
    vehicleId: z.coerce.number().int().positive(),
    readingDate: z.coerce.date().optional(),
    mileage: z.coerce.number().int().positive(),
    notes: z.string().optional().nullable(),
    createdBy: z.string().optional().nullable(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const updateOdometerSchema = z.object({
  params: z.object({
    readingId: z.coerce.number().int().positive(),
  }),
  body: z.object({
    readingDate: z.coerce.date(),
    mileage: z.coerce.number().int().positive(),
    notes: z.string().optional().nullable(),
    createdBy: z.string().optional().nullable(),
  }),
  query: z.object({}).optional(),
});

export const readingIdParamSchema = z.object({
  params: z.object({
    readingId: z.coerce.number().int().positive(),
  }),
  body: z.object({}).optional(),
  query: z.object({}).optional(),
});
