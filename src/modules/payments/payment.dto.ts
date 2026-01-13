import { z } from "zod";

// Input validation for payment endpoints.
export const paymentIdParamSchema = z.object({
  params: z.object({
    paymentId: z.coerce.number().int().positive(),
  }),
  body: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const assignPaymentDriverSchema = z.object({
  params: z.object({
    paymentId: z.coerce.number().int().positive(),
  }),
  body: z.object({
    driverId: z.coerce.number().int().positive().nullable(),
    createdBy: z.string().optional().nullable(),
  }),
  query: z.object({}).optional(),
});
