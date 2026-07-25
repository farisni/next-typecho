import { z } from "zod";

export const settingsSchema = z.object({
  siteName: z.string().trim().min(1).max(80),
  siteDescription: z.string().trim().max(200),
  postsPerPage: z.coerce.number().int().min(1).max(50),
  boxModel: z.boolean(),
});
