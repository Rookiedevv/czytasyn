import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const url = process.env.DATABASE_URL;

if (!url) {
  // `next build` evaluates this module without secrets; only warn here.
  // Any real query will fail until DATABASE_URL is set.
  console.warn(
    "[czytasyn] DATABASE_URL is not set. On Vercel: Storage → Neon → Connect to project. Locally: `vercel env pull .env.local`.",
  );
}

export const db = drizzle(neon(url ?? "postgresql://missing:missing@localhost:5432/missing"), {
  schema,
});

export { schema };
