import { z } from "zod";

const EnvSchema = z.object({
  VITE_API_URL: z.string().url().optional(),
});

const parsed = EnvSchema.safeParse(import.meta.env);

export const env = {
  VITE_API_URL: parsed.success ? parsed.data.VITE_API_URL : undefined,
};

