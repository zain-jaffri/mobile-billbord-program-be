import { z } from "zod";

export const docusignTestSendSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    email: z.string().email(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});
