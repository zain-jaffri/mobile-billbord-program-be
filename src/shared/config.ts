import "dotenv/config";

// Centralized config shape to keep env usage consistent and typed.
export type AppConfig = {
  env: "development" | "test" | "production";
  port: number;
  db: {
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
    ssl: boolean;
  };
  zapier: {
    webhookUrl?: string;
  };
};

// Helper to enforce required env values at startup.
const required = (key: string, value: string | undefined): string => {
  if (!value) {
    throw new Error(`Missing required env var: ${key}`);
  }
  return value;
};

// Resolve config once at startup so downstream code stays clean.
export const config: AppConfig = {
  env: (process.env.NODE_ENV as AppConfig["env"]) || "development",
  port: Number(process.env.PORT || 3000),
  db: {
    host: required("DB_HOST", process.env.DB_HOST),
    port: Number(process.env.DB_PORT || 3306),
    username: required("DB_USER", process.env.DB_USER),
    password: required("DB_PASSWORD", process.env.DB_PASSWORD),
    database: required("DB_NAME", process.env.DB_NAME),
    ssl: process.env.DB_SSL === "true",
  },
  zapier: {
    webhookUrl: process.env.ZAPIER_WEBHOOK_URL,
  },
};
