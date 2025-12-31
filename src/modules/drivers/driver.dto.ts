import { z } from "zod";

// Input validation for driver-related endpoints.
export const createDriverSchema = z.object({
  body: z.object({
    signupDate: z.coerce.date(),
    firstName: z.string().min(1),
    lastName: z.string().optional().nullable(),
    licenseState: z.string().optional().nullable(),
    licenseNumber: z.string().optional().nullable(),
    phone: z.string().optional().nullable(),
    email: z.string().email().optional().nullable(),
    preferredLanguage: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    city: z.string().optional().nullable(),
    state: z.string().optional().nullable(),
    zip: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    referredBy: z.coerce.number().int().positive().optional().nullable(),
    isSignedContract: z.coerce.boolean().optional().default(false),
    isInactive: z.coerce.boolean().optional().default(false),
    vehicle: z.object({
      plateNumber: z.string().optional().nullable(),
      state: z.string().optional().nullable(),
      make: z.string().optional().nullable(),
      model: z.string().optional().nullable(),
      year: z.coerce.number().int().positive().optional().nullable(),
      vin: z.string().optional().nullable(),
      color: z.string().optional().nullable(),
      notes: z.string().optional().nullable(),
    }),
    deployment: z
      .object({
        qrId: z.coerce.number().int().positive(),
        actionDate: z.coerce.date(),
        notes: z.string().optional().nullable(),
      })
      .optional(),
    odometer: z
      .object({
        readingDate: z.coerce.date(),
        mileage: z.coerce.number().int().positive(),
        notes: z.string().optional().nullable(),
      })
      .optional(),
    createdBy: z.string().optional().nullable(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const returningDriverSchema = z.object({
  body: z.object({
    driverId: z.coerce.number().int().positive(),
    vehicleId: z.coerce.number().int().positive(),
    phone: z.string().optional().nullable(),
    email: z.string().email().optional().nullable(),
    plateNumber: z.string().optional().nullable(),
    qrId: z.coerce.number().int().positive().optional().nullable(),
    eventDate: z.coerce.date(),
    mileage: z.coerce.number().int().positive(),
    driverNotes: z.string().optional().nullable(),
    vehicleNotes: z.string().optional().nullable(),
    deploymentNotes: z.string().optional().nullable(),
    odometerNotes: z.string().optional().nullable(),
    createdBy: z.string().optional().nullable(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const driverIdParamSchema = z.object({
  params: z.object({
    driverId: z.coerce.number().int().positive(),
  }),
  body: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const updateDriverSchema = z.object({
  params: z.object({
    driverId: z.coerce.number().int().positive(),
  }),
  body: z.object({
    firstName: z.string().min(1),
    lastName: z.string().optional().nullable(),
    phone: z.string().optional().nullable(),
    email: z.string().email().optional().nullable(),
    address: z.string().optional().nullable(),
    city: z.string().optional().nullable(),
    state: z.string().optional().nullable(),
    zip: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    signupDate: z.coerce.date(),
    licenseState: z.string().optional().nullable(),
    licenseNumber: z.string().optional().nullable(),
    preferredLanguage: z.string().optional().nullable(),
    referredBy: z.coerce.number().int().positive().optional().nullable(),
    isSignedContract: z.coerce.boolean().optional().default(false),
    isInactive: z.coerce.boolean().optional().default(false),
    createdBy: z.string().optional().nullable(),
  }),
  query: z.object({}).optional(),
});

export const searchDriversSchema = z.object({
  query: z.object({
    q: z.string().optional().default(""),
    vehicleId: z.coerce.number().int().positive().optional(),
  }),
  params: z.object({}).optional(),
  body: z.object({}).optional(),
});
