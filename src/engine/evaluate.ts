// Evaluator: applies a finished session's results to the learner model.

import { PL_GPC_ORDER } from "./graph";
import { applyTrial, freshState, getState, type StateMap } from "./model";
import { introduceNodes } from "./composer";

export type TrialResult = {
  node: string;
  type: string;
  ok: boolean;
  /** Reaction time in ms for the final (correct or last) answer. */
  ms: number;
  /** ISO timestamp. */
  t: string;
};

/** Normal session: every result updates its node in order. */
export function evaluateSession(states: StateMap, results: TrialResult[], session: number): StateMap {
  const next: StateMap = Object.fromEntries(Object.entries(states).map(([k, v]) => [k, { ...v, recent: [...v.recent] }]));
  for (const r of results) {
    const prev = getState(next, r.node);
    if (prev.status === "locked") continue;
    next[r.node] = applyTrial(prev, r.ok, r.ms, new Date(r.t), session);
  }
  return next;
}

/**
 * Placement probe: a letter answered correctly starts as practising on a 7-day
 * interval (not locked), so a child who already knows letters is not bored.
 * The first vowel is always introduced so there is something to learn.
 */
export function evaluateProbe(results: TrialResult[], now: Date): StateMap {
  const states: StateMap = {};
  states["pa:syllable-clap"] = freshState("pa:syllable-clap", "introduced");
  states["pa:first-sound"] = freshState("pa:first-sound", "introduced");
  for (const r of results) {
    if (!r.node.startsWith("pl:")) {
      states[r.node] = applyTrial(getState(states, r.node), r.ok, r.ms, new Date(r.t), 1);
      continue;
    }
    if (r.ok) {
      const st = freshState(r.node, "practising");
      st.streak = 2;
      st.seen = 1;
      st.ok = 1;
      st.interval = 3; // 7 days
      st.dueAt = new Date(now.getTime() + 7 * 86_400_000).toISOString();
      st.recent = [{ ok: true, ms: r.ms, t: r.t, s: 1 }];
      states[r.node] = st;
    }
  }
  if (!states[PL_GPC_ORDER[0]]) states[PL_GPC_ORDER[0]] = freshState(PL_GPC_ORDER[0], "introduced");
  introduceNodes(states);
  return states;
}
