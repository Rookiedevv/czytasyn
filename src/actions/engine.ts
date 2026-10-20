"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getOwnChild } from "@/actions/children";
import type { StateMap, NodeState } from "@/engine/model";
import { evaluateProbe, evaluateSession, type TrialResult } from "@/engine/evaluate";
import { WORLDS } from "@/engine/content";

export async function loadStates(childId: string): Promise<StateMap> {
  const supabase = await createClient();
  const { data } = await supabase.from("czytasyn_node_state").select("node_id, state").eq("child_id", childId);
  const map: StateMap = {};
  for (const row of data ?? []) map[row.node_id as string] = row.state as NodeState;
  return map;
}

export async function setWorld(childId: string, worldId: string) {
  if (!WORLDS[worldId]) return;
  const supabase = await createClient();
  await supabase.from("czytasyn_children").update({ world: worldId }).eq("id", childId);
}

export type FinishInput = {
  childId: string;
  sessionNumber: number;
  worldId: string;
  probe: boolean;
  /** States the session started from (after introductions), as computed on the client. */
  states: StateMap;
  results: TrialResult[];
  startedAt: string;
};

/**
 * Commits a finished session: re-runs the evaluator on the server (so the
 * stored model never depends on client state), logs the trials, bumps the
 * session count and unlocks the next collection item for the world.
 */
export async function finishSession(input: FinishInput) {
  const child = await getOwnChild(input.childId);
  if (!child) throw new Error("Unknown child");
  const supabase = await createClient();
  const now = new Date();

  const next = input.probe
    ? evaluateProbe(input.results, now)
    : evaluateSession(input.states, input.results, input.sessionNumber);

  const rows = Object.values(next).map((state) => ({
    child_id: child.id,
    node_id: state.nodeId,
    state,
    updated_at: now.toISOString(),
  }));
  if (rows.length) {
    const { error } = await supabase.from("czytasyn_node_state").upsert(rows, { onConflict: "child_id,node_id" });
    if (error) throw new Error(error.message);
  }

  const correct = input.results.filter((r) => r.ok).length;
  await supabase.from("czytasyn_sessions").insert({
    child_id: child.id,
    number: input.sessionNumber,
    world_id: input.worldId,
    probe: input.probe,
    trials: input.results.length,
    correct,
    results: input.results,
    started_at: input.startedAt,
    finished_at: now.toISOString(),
  });

  // Collection reward: one new item per finished session, per world.
  const { data: fresh } = await supabase
    .from("czytasyn_children")
    .select("session_count, collection")
    .eq("id", child.id)
    .single();
  const collection = { ...((fresh?.collection as Record<string, number>) ?? {}) };
  const world = WORLDS[input.worldId];
  if (world && !input.probe) {
    collection[input.worldId] = Math.min((collection[input.worldId] ?? 0) + 1, world.collection.length);
  }
  await supabase
    .from("czytasyn_children")
    .update({
      session_count: Math.max((fresh?.session_count as number) ?? 0, input.sessionNumber),
      collection,
      world: input.worldId,
    })
    .eq("id", child.id);

  revalidatePath(`/app/play/${child.id}`);
  revalidatePath("/app/parent");
  return { collection: collection[input.worldId] ?? 0 };
}

export async function recentSessions(childId: string, limit = 5) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("czytasyn_sessions")
    .select("number, world_id, probe, trials, correct, results, finished_at")
    .eq("child_id", childId)
    .order("number", { ascending: false })
    .limit(limit);
  return data ?? [];
}
