import { existsSync } from "node:fs";
import { defineConfig } from "drizzle-kit";

// drizzle-kit only reads .env; local dev keeps secrets in .env.local.
// For Neon, run migrations against the direct (non-pooled) connection string.
if (existsSync(".env.local")) process.loadEnvFile(".env.local");

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
