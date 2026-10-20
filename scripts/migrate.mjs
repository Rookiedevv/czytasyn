// Applies pending SQL migrations from ./drizzle before every build.
// Runs automatically on Vercel, so the Supabase schema is always in sync
// with the deployed code. Uses the direct (non-pooled) connection when available.
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";

const url =
  process.env.DIRECT_URL ??
  process.env.POSTGRES_URL_NON_POOLING ??
  process.env.DATABASE_URL ??
  process.env.POSTGRES_URL;

if (!url) {
  console.log("[migrate] no database URL set, skipping migrations.");
  process.exit(0);
}

const client = postgres(url, { prepare: false, max: 1 });
try {
  await migrate(drizzle(client), { migrationsFolder: "./drizzle", migrationsSchema: "czytasyn" });
  console.log("[migrate] database is up to date.");
} finally {
  await client.end();
}
