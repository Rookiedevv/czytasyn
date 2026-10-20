"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/db";
import { children, progress } from "@/db/schema";
import { AVATARS, THEMES } from "@/content/lessons";

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not signed in");
  return session.user.id;
}

export async function listChildren() {
  const userId = await requireUserId();
  return db.select().from(children).where(eq(children.userId, userId));
}

/** Returns the child only if it belongs to the signed-in parent. */
export async function getOwnChild(childId: string) {
  const userId = await requireUserId();
  const rows = await db
    .select()
    .from(children)
    .where(and(eq(children.id, childId), eq(children.userId, userId)));
  return rows[0] ?? null;
}

export async function createChild(formData: FormData) {
  const userId = await requireUserId();
  const name = String(formData.get("name") ?? "").trim().slice(0, 30);
  const avatar = String(formData.get("avatar") ?? AVATARS[0]);
  const theme = String(formData.get("theme") ?? "forest");
  const lang = String(formData.get("lang") ?? "pl") === "en" ? "en" : "pl";
  if (!name) return;

  await db.insert(children).values({
    userId,
    name,
    avatar: AVATARS.includes(avatar) ? avatar : AVATARS[0],
    theme: theme in THEMES ? theme : "forest",
    lang,
  });
  revalidatePath("/app");
  revalidatePath("/app/parent");
}

export async function deleteChild(formData: FormData) {
  const userId = await requireUserId();
  const childId = String(formData.get("childId") ?? "");
  await db
    .delete(children)
    .where(and(eq(children.id, childId), eq(children.userId, userId)));
  revalidatePath("/app");
  revalidatePath("/app/parent");
}

export async function getProgress(childId: string) {
  const child = await getOwnChild(childId);
  if (!child) return [];
  return db.select().from(progress).where(eq(progress.childId, childId));
}

export async function saveProgress(input: {
  childId: string;
  lessonId: string;
  stars: number;
  masteredItems: string[];
}) {
  const child = await getOwnChild(input.childId);
  if (!child) throw new Error("Unknown child");
  const stars = Math.max(0, Math.min(3, Math.round(input.stars)));

  const existing = (
    await db
      .select()
      .from(progress)
      .where(and(eq(progress.childId, child.id), eq(progress.lessonId, input.lessonId)))
  )[0];

  const mastered = Array.from(
    new Set([...(existing?.masteredItems ?? []), ...input.masteredItems]),
  );

  await db
    .insert(progress)
    .values({
      childId: child.id,
      lessonId: input.lessonId,
      stars,
      attempts: 1,
      completed: stars > 0,
      masteredItems: mastered,
      lastSeen: new Date(),
    })
    .onConflictDoUpdate({
      target: [progress.childId, progress.lessonId],
      set: {
        stars: Math.max(stars, existing?.stars ?? 0),
        attempts: (existing?.attempts ?? 0) + 1,
        completed: (existing?.completed ?? false) || stars > 0,
        masteredItems: mastered,
        lastSeen: new Date(),
      },
    });

  revalidatePath(`/app/play/${child.id}`);
  revalidatePath("/app/parent");
}
