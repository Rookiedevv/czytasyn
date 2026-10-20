import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

// Supabase Postgres. Prefer the pooled connection string (Supabase "Transaction"
// pooler, port 6543) for the app. Works with both ways of wiring it up:
//  - Vercel ↔ Supabase integration: sets POSTGRES_URL / POSTGRES_URL_NON_POOLING
//  - manual: DATABASE_URL (pooled) and optionally DIRECT_URL (direct, for migrations)
export const DATABASE_URL = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
export const DIRECT_URL =
  process.env.DIRECT_URL ?? process.env.POSTGRES_URL_NON_POOLING ?? DATABASE_URL;

if (!DATABASE_URL) {
  // `next build` evaluates this module without secrets; only warn here.
  console.warn(
    "[czytasyn] DATABASE_URL is not set. Add the Supabase connection string in Vercel → Settings → Environment Variables.",
  );
}

const client = postgres(DATABASE_URL ?? "postgresql://missing:missing@localhost:5432/missing", {
  // Required for Supabase's transaction pooler (no prepared statements).
  prepare: false,
  max: 1,
});

export const db = drizzle(client, { schema });
export { schema };
