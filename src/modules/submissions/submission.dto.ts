import { z } from "zod";

// Input validation for submission endpoints.
export const createSubmissionSchema = z.object({
  body: z.object({
    qrId: z.coerce.number().int().positive().optional().nullable(),
    source: z.string().min(1).optional().default("main"),
    externalId: z.string().optional().nullable(),
    respondentId: z.string().optional().nullable(),
    firstName: z.string().min(1),
    lastName: z.string().optional().nullable(),
    phone: z.string().min(1),
    email: z.string().email().optional().nullable(),
    beenAccident: z.coerce.boolean(),
    consentSms: z.coerce.boolean(),
    notes: z.string().optional().nullable(),
    createdBy: z.string().optional().nullable().default("automatic"),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const submissionIdParamSchema = z.object({
  params: z.object({
    submissionId: z.coerce.number().int().positive(),
  }),
  body: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const assignQrSchema = z.object({
  params: z.object({
    submissionId: z.coerce.number().int().positive(),
  }),
  body: z.object({
    qrId: z.coerce.number().int().positive(),
  }),
  query: z.object({}).optional(),
});
