"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AVATARS } from "@/content/lessons";

export type Child = {
  id: string;
  user_id: string;
  name: string;
  avatar: string;
  theme: string;
  lang: "pl" | "en";
  created_at: string;
  session_count: number;
  world: string;
  collection: Record<string, number>;
};

export type Progress = {
  child_id: string;
  lesson_id: string;
  stars: number;
  attempts: number;
  completed: boolean;
  mastered_items: string[];
  last_seen: string;
};

// Row Level Security in Supabase already restricts every query to the
// signed-in parent's own rows, so these helpers stay simple.

export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function listChildren(): Promise<Child[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("czytasyn_children")
    .select("*")
    .order("created_at");
  if (error) throw new Error(error.message);
  return (data ?? []) as Child[];
}

export async function getOwnChild(childId: string): Promise<Child | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("czytasyn_children").select("*").eq("id", childId).maybeSingle();
  return (data as Child | null) ?? null;
}

export async function createChild(formData: FormData) {
  const supabase = await createClient();
  const user = await getUser();
  if (!user) redirect("/");

  const name = String(formData.get("name") ?? "").trim().slice(0, 30);
  const avatar = String(formData.get("avatar") ?? AVATARS[0]);
  const lang = String(formData.get("lang") ?? "pl") === "en" ? "en" : "pl";
  if (!name) return;

  const { error } = await supabase.from("czytasyn_children").insert({
    user_id: user.id,
    name,
    avatar: AVATARS.includes(avatar) ? avatar : AVATARS[0],
    lang,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/app");
  revalidatePath("/app/parent");
}

export async function deleteChild(formData: FormData) {
  const supabase = await createClient();
  const childId = String(formData.get("childId") ?? "");
  await supabase.from("czytasyn_children").delete().eq("id", childId);
  revalidatePath("/app");
  revalidatePath("/app/parent");
}

export async function getProgress(childId: string): Promise<Progress[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("czytasyn_progress").select("*").eq("child_id", childId);
  return (data ?? []) as Progress[];
}

export async function getAllProgress(): Promise<Progress[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("czytasyn_progress").select("*");
  return (data ?? []) as Progress[];
}

export async function saveProgress(input: {
  childId: string;
  lessonId: string;
  stars: number;
  masteredItems: string[];
}) {
  const supabase = await createClient();
  const stars = Math.max(0, Math.min(3, Math.round(input.stars)));

  const { data: existing } = await supabase
    .from("czytasyn_progress")
    .select("*")
    .eq("child_id", input.childId)
    .eq("lesson_id", input.lessonId)
    .maybeSingle<Progress>();

  const mastered = Array.from(new Set([...(existing?.mastered_items ?? []), ...input.masteredItems]));

  const { error } = await supabase.from("czytasyn_progress").upsert(
    {
      child_id: input.childId,
      lesson_id: input.lessonId,
      stars: Math.max(stars, existing?.stars ?? 0),
      attempts: (existing?.attempts ?? 0) + 1,
      completed: (existing?.completed ?? false) || stars > 0,
      mastered_items: mastered,
      last_seen: new Date().toISOString(),
    },
    { onConflict: "child_id,lesson_id" },
  );
  if (error) throw new Error(error.message);

  revalidatePath(`/app/play/${input.childId}`);
  revalidatePath("/app/parent");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
