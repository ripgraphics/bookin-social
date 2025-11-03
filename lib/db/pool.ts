import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var __bookinDbPool: Pool | undefined;
}

const connectionString = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;

export function getDbPool() {
  if (!connectionString) {
    throw new Error("SUPABASE_DB_URL (or DATABASE_URL) must be set to use the shared Postgres pool");
  }

  if (!global.__bookinDbPool) {
    global.__bookinDbPool = new Pool({
      connectionString,
      max: 5, // Reduced from 10 to prevent max clients error in development
      idleTimeoutMillis: 10_000, // Reduced from 30s for faster cleanup
      connectionTimeoutMillis: 30_000, // Increased from 10s to 30s for Supabase
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

