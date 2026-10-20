import {
  boolean,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";

// ---------------------------------------------------------------------------
// Auth.js tables (parents). Shape required by @auth/drizzle-adapter.
// ---------------------------------------------------------------------------

export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
});

export const accounts = pgTable(
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

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
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

export const children = pgTable("child", {
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

export const progress = pgTable(
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
