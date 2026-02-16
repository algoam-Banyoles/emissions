import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL es obligatoria"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  JWT_ACCESS_SECRET: z.string().min(32, "JWT_ACCESS_SECRET ha de tenir almenys 32 caracters"),
  JWT_REFRESH_SECRET: z.string().min(32, "JWT_REFRESH_SECRET ha de tenir almenys 32 caracters"),
  ACCESS_TOKEN_TTL: z.string().default("15m"),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(7),
  ENABLE_EMISSIONS_VALIDATION_CRON: z
    .union([z.boolean(), z.enum(["true", "false"])])
    .default(true)
    .transform((value) => (typeof value === "string" ? value === "true" : value)),
  EMISSIONS_VALIDATION_CRON: z.string().default("0 3 * * *"),
  SMTP_HOST: z.string().optional().default(""),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_SECURE: z
    .union([z.boolean(), z.enum(["true", "false"])])
    .default(false)
    .transform((value) => (typeof value === "string" ? value === "true" : value)),
  SMTP_USER: z.string().optional().default(""),
  SMTP_PASS: z.string().optional().default(""),
  SMTP_FROM: z.string().default("alerts@emissionsv2.local"),
  ALERT_EMAIL_TO: z.string().default(""),
  REDIS_URL: z.string().optional().default(""),
  GIS_PROVIDER: z.enum(["openrouteservice"]).default("openrouteservice"),
  ORS_API_KEY: z.string().optional().default(""),
  ORS_BASE_URL: z.string().default("https://api.openrouteservice.org"),
  ORS_PROFILE: z.string().default("driving-car"),
  ROUTE_CACHE_TTL_SECONDS: z.coerce.number().int().positive().default(86400),
  LOG_LEVEL: z.enum(["error", "warn", "info", "http", "verbose", "debug", "silly"]).default("info"),
  SENTRY_DSN: z.string().optional().default(""),
  AWS_REGION: z.string().default("eu-west-1"),
  S3_BUCKET: z.string().optional().default(""),
});

export const env = envSchema.parse(process.env);
