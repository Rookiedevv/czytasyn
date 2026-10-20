// Applies pending SQL migrations from ./drizzle before every build.
// Runs automatically on Vercel (DATABASE_URL comes from the Neon integration),
// so the database schema is always in sync with the deployed code.
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";

const url = process.env.DATABASE_URL;
if (!url) {
  console.log("[migrate] DATABASE_URL not set, skipping migrations.");
  process.exit(0);
}

const db = drizzle(neon(url));
await migrate(db, { migrationsFolder: "./drizzle" });
console.log("[migrate] database is up to date.");
