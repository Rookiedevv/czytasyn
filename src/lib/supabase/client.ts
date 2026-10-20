"use client";

import { createBrowserClient } from "@supabase/ssr";
import { env } from "./env";

/** Supabase client for Client Components (browser). */
export function createClient() {
  return createBrowserClient(env.url, env.key);
}
