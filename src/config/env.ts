import { z } from "zod";

const booleanCoerce = z.preprocess((val) => {
  if (typeof val === "string") {
    if (val.toLowerCase() === "true") return true;
    if (val.toLowerCase() === "false") return false;
  }
  return val;
}, z.boolean());

export const envSchema = z.object({
  // Application
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default("0.0.0.0"),
  APP_NAME: z.string().default("Webhook Platform"),
  APP_DESCRIPTION: z.string().default("Documentação técnica da Webhook Platform"),
  APP_VERSION: z.string().default("1.0"),
  API_PREFIX: z.string().default("v1"),
  API_VERSION: z.coerce.number().default(1),

  // Database
  DATABASE_URL: z.string().url(),
  DATABASE_DIALECT: z.string().default("postgresql"),

  // Refresh Token
  REFRESH_TOKEN_EXP_HOUR: z.coerce.number().int().positive().default(168),

  // Redis
  REDIS_HOST: z.string().default("localhost"),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional().default(""),
  REDIS_DB: z.coerce.number().default(0),
  REDIS_TLS: booleanCoerce.default(false),
  REDIS_READY_CHECK: booleanCoerce.default(true),
  REDIS_KEY_PREFIX: z.string().optional().default(""),
  REDIS_KEEP_ALIVE: z.coerce.number().default(30000),

  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRATION_SECONDS: z.coerce.number().default(3600),
  ISSUER: z.string().default("webhook-platform-test"),
  AUDIENCE: z.string().default("webhook-platform-api-test"),

  // CORS
  CORS_ORIGIN: z.union([booleanCoerce, z.string()]).default(true),
  CORS_CREDENTIALS: booleanCoerce.default(true),

  // HTTP / Validation
  GLOBAL_PIPES_WHITELIST: booleanCoerce.default(true),
  GLOBAL_PIPES_FORBID_NON_WHITE_LISTED: booleanCoerce.default(true),
  GLOBAL_PIPES_TRANSFORM: booleanCoerce.default(true),

  // Multipart
  MULTIPART_FILE_SIZE_MB: z.coerce.number().default(40),

  // Swagger
  SWAGGER_ENABLED: booleanCoerce.default(true),
  SWAGGER_PATH: z.string().default("api"),

  // RBAC: Converte "USER,MODERATOR,ADMIN" diretamente em string[]
  ROLES: z
    .string()
    .transform((val) => val.split(",").map((role) => role.trim())),

  // Master User
  NAME_MASTER: z.string().min(1, "NAME_MASTER is required"),
  FULL_NAME_MASTER: z.string().min(1, "FULL_NAME_MASTER is required"),
  EMAIL_MASTER: z.string().email("EMAIL_MASTER must be a valid email address"),
  PASSWORD_MASTER: z.string().min(8, "PASSWORD_MASTER must be at least 8 characters long"),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>) {
  const result = envSchema.safeParse(config);

  if (!result.success) {
    console.error(
      "❌ Invalid environment variables:",
      result.error.flatten().fieldErrors,
    );
    throw new Error("Invalid environment variables");
  }

  return result.data;
}