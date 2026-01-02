import { z } from "zod";

export const createMonthlySubmissionSchema = z.object({
  body: z.object({
    odometerMileage: z.number().int().positive(),
    odometerDate: z.string().min(1),
  }),
});

export const monthlySubmissionPhotoSchema = z.object({
  params: z.object({
    submissionId: z.string().regex(/^\d+$/),
  }),
  body: z.object({
    photos: z
      .array(
        z.object({
          photoType: z.enum(["front", "back", "left", "right", "odometer"]),
          fileName: z.string().min(1),
          contentType: z.string().min(1),
          base64: z.string().min(1),
        })
      )
      .min(1),
  }),
});
