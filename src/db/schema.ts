import {
  boolean,
  integer,
  jsonb,
  pgSchema,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

// All Czytasyn tables live in their own Postgres schema, so the app can share a
// Supabase project (one database) with other apps without any name clashes.
import type { AdapterAccountType } from "next-auth/adapters";

export const czytasyn = pgSchema("czytasyn");

// ---------------------------------------------------------------------------
// Auth.js tables (parents). Shape required by @auth/drizzle-adapter.
// ---------------------------------------------------------------------------

export const users = czytasyn.table("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
});

export const accounts = czytasyn.table(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({ columns: [account.provider, account.providerAccountId] }),
  ],
);

export const sessions = czytasyn.table("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = czytasyn.table(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })],
);

// ---------------------------------------------------------------------------
// Czytasyn tables. A child never has an account; it belongs to a parent user.
// ---------------------------------------------------------------------------

export const children = czytasyn.table("child", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  avatar: text("avatar").notNull().default("🦊"),
  theme: text("theme").notNull().default("forest"),
  lang: text("lang").notNull().default("pl"), // "pl" | "en"
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
});

export const progress = czytasyn.table(
  "progress",
  {
    childId: text("childId")
      .notNull()
      .references(() => children.id, { onDelete: "cascade" }),
    lessonId: text("lessonId").notNull(),
    stars: integer("stars").notNull().default(0), // best result 0-3
    attempts: integer("attempts").notNull().default(0),
    completed: boolean("completed").notNull().default(false),
    masteredItems: jsonb("masteredItems").$type<string[]>().notNull().default([]),
    lastSeen: timestamp("lastSeen", { mode: "date" }).notNull().defaultNow(),
  },
  (p) => [primaryKey({ columns: [p.childId, p.lessonId] })],
);

export type Child = typeof children.$inferSelect;
export type Progress = typeof progress.$inferSelect;
