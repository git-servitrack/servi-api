import { config as loadEnv } from "dotenv";
import { z } from "zod";

loadEnv();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  API_PREFIX: z.string().default("/api"),
  API_VERSION: z.string().default("v1"),
  MONGO_URI: z.string().min(1, "MONGO_URI is required"),
  CORS_ORIGIN: z.string().default("*"),
  LOG_LEVEL: z.string().default("info"),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  DAMAGE_DETECTION_MODEL_DIR: z.string().default("data/tm-my-image-model"),
  DAMAGE_DETECTION_MIN_CONFIDENCE: z.coerce.number().min(0).max(1).default(0.65),
  DAMAGE_DETECTION_TIMEOUT_MS: z.coerce.number().int().positive().default(10000),
  ACCESS_TOKEN_SECRET: z.string().min(16).default("dev_access_token_secret_please_change"),
  REFRESH_TOKEN_SECRET: z.string().min(16).default("dev_refresh_token_secret_please_change"),
  ACCESS_TOKEN_EXPIRES_IN: z.string().default("15m"),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default("7d"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const errors = parsed.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join(", ");
  throw new Error(`Invalid environment configuration: ${errors}`);
}

export const env = parsed.data;
export const API_BASE_PATH = `${env.API_PREFIX}/${env.API_VERSION}`;
