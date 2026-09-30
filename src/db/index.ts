import "server-only";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type Db = PostgresJsDatabase<typeof schema>;

// Created on first use, not at import, so `next build` works without
// DATABASE_URL. One client is reused across dev hot reloads. `prepare: false`
// keeps it compatible with pooled (PgBouncer) connection strings.
const globalForDb = globalThis as unknown as { db?: Db };

export function getDb(): Db {
  if (globalForDb.db) return globalForDb.db;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  globalForDb.db = drizzle(postgres(url, { prepare: false, max: 5 }), { schema });
  return globalForDb.db;
}
