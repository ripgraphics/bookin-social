import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var __bookinDbPool: Pool | undefined;
}

const connectionString = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("SUPABASE_DB_URL (or DATABASE_URL) must be set to use the shared Postgres pool");
}

export function getDbPool() {
  if (!global.__bookinDbPool) {
    global.__bookinDbPool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
      ssl: connectionString.includes("sslmode=require") ? { rejectUnauthorized: false } : undefined,
    });
  }

  return global.__bookinDbPool;
}

export async function withClient<T>(fn: (client: Pool) => Promise<T>): Promise<T> {
  const pool = getDbPool();
  return fn(pool);
}

export async function query<T = any>(text: string, params?: any[]) {
  const pool = getDbPool();
  return pool.query<T>(text, params);
}

