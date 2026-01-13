import { z } from "zod";

// Input validation for QR code endpoints.
export const createQrSchema = z.object({
  body: z.object({
    externalId: z.string().optional().nullable(),
    codeValue: z.string().min(1),
    source: z.enum(["local", "qrio"]).optional().default("local"),
    lastSynced: z.coerce.date().optional().nullable(),
    notes: z.string().optional().nullable(),
    createdBy: z.string().optional().nullable(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const updateQrSchema = z.object({
  params: z.object({
    qrId: z.coerce.number().int().positive(),
  }),
  body: z.object({
    externalId: z.string().optional().nullable(),
    codeValue: z.string().min(1),
    source: z.enum(["local", "qrio"]).optional().default("local"),
    lastSynced: z.coerce.date().optional().nullable(),
    notes: z.string().optional().nullable(),
    createdBy: z.string().optional().nullable(),
  }),
  query: z.object({}).optional(),
});

export const qrIdParamSchema = z.object({
  params: z.object({
    qrId: z.coerce.number().int().positive(),
  }),
  body: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const searchQrSchema = z.object({
  query: z.object({
    q: z.string().min(1),
  }),
  params: z.object({}).optional(),
  body: z.object({}).optional(),
});
