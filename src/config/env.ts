import { z } from "zod";

export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]),

  PORT: z.coerce.number().default(3000),

  DATABASE_URL: z.string().url(),

  JWT_SECRET: z.string().min(32),

  JWT_EXPIRES_IN: z.string(),

  JWT_REFRESH_SECRET: z.string().min(32),

  JWT_REFRESH_EXPIRES_IN: z.string(),

  REDIS_URL: z.string(),

  RABBITMQ_URL: z.string(),

  REFRESH_TOKEN_EXP: z.coerce.number().int().positive()
});

export const env = envSchema.parse(process.env);