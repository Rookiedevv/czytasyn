// Learner model: per-node state and the rules that move a node between
// locked → introduced → practising → mastered (and back on failure).
// Pure functions; the same code runs on the iPad and on the server.

import { NODE_BY_ID, PL_GPC_ORDER } from "./graph";

export type NodeStatus = "locked" | "introduced" | "practising" | "mastered";

export type TrialRecord = {
  ok: boolean;
  ms: number;
  /** ISO timestamp. */
  t: string;
  /** Session number the trial happened in. */
  s: number;
};

export type NodeState = {
  nodeId: string;
  status: NodeStatus;
  /** Index into INTERVAL_DAYS. */
  interval: number;
  /** ISO timestamp when the node is next due. */
  dueAt: string;
  streak: number;
  seen: number;
  ok: number;
  /** Last trials, newest last (capped). */
  recent: TrialRecord[];
  /** True if the node was mastered once and fell back. */
  demoted: boolean;
};

/** Expanding review schedule, in days. Index 0 = again this session. */
export const INTERVAL_DAYS = [0, 1, 3, 7, 14, 30, 60, 120];
const RECENT_CAP = 12;
const DAY_MS = 86_400_000;

export function freshState(nodeId: string, status: NodeStatus = "locked"): NodeState {
  return {
    nodeId,
    status,
    interval: 0,
    dueAt: new Date(0).toISOString(),
    streak: 0,
    seen: 0,
    ok: 0,
    recent: [],
    demoted: false,
  };
}

export type StateMap = Record<string, NodeState>;

export function getState(map: StateMap, nodeId: string): NodeState {
  return map[nodeId] ?? (map[nodeId] = freshState(nodeId));
}

function dayKey(iso: string) {
  return iso.slice(0, 10);
}

function median(xs: number[]) {
  if (xs.length === 0) return Infinity;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

/** Mastery rule from the design doc, applied to the last 10 trials. */
export function meetsMastery(state: NodeState): boolean {
  const node = NODE_BY_ID[state.nodeId];
  const last = state.recent.slice(-10);
  if (last.length < 6) return false;
  const acc = last.filter((r) => r.ok).length / last.length;
  if (acc < 0.9) return false;
  const sessions = new Set(last.map((r) => r.s));
  const days = new Set(last.map((r) => dayKey(r.t)));
  if (sessions.size < 2 || days.size < 2) return false;
  const lat = median(last.filter((r) => r.ok).map((r) => r.ms));
  if (lat > (node?.latencyMs ?? 2000)) return false;
  // At least one correct retrieval after a gap of ≥ 1 day since the previous trial
  // (the doc says 3 days; 1 day keeps early sessions motivating and is tightened
  // by the review schedule afterwards).
  for (let i = 1; i < state.recent.length; i++) {
    const gap = Date.parse(state.recent[i].t) - Date.parse(state.recent[i - 1].t);
    if (state.recent[i].ok && gap >= DAY_MS) return true;
  }
  return false;
}

/** Applies one trial result to a node and returns the new state. */
export function applyTrial(
  prev: NodeState,
  ok: boolean,
  ms: number,
  now: Date,
  session: number,
): NodeState {
  const st: NodeState = { ...prev, recent: [...prev.recent] };
  st.seen += 1;
  st.recent.push({ ok, ms, t: now.toISOString(), s: session });
  if (st.recent.length > RECENT_CAP) st.recent.splice(0, st.recent.length - RECENT_CAP);

  if (ok) {
    st.ok += 1;
    st.streak += 1;
    st.interval = Math.min(st.interval + 1, INTERVAL_DAYS.length - 1);
  } else {
    st.streak = 0;
    st.interval = Math.max(0, st.interval - 2);
  }

  if (st.status === "introduced") st.status = "practising";

  if (st.status === "mastered") {
    const lastTwo = st.recent.slice(-2);
    if (lastTwo.length === 2 && lastTwo.every((r) => !r.ok)) {
      st.status = "practising";
      st.demoted = true;
      st.interval = 1;
    }
  } else if (st.status === "practising" && meetsMastery(st)) {
    st.status = "mastered";
    st.interval = Math.max(st.interval, 2); // at least 3 days until the next review
  }

  st.dueAt = new Date(now.getTime() + INTERVAL_DAYS[st.interval] * DAY_MS).toISOString();
  return st;
}

export function isMastered(map: StateMap, nodeId: string) {
  return map[nodeId]?.status === "mastered";
}

export function masteredGraphemes(map: StateMap): string[] {
  return PL_GPC_ORDER.filter((id) => isMastered(map, id)).map((id) => NODE_BY_ID[id].grapheme!);
}

export function practisingGraphemes(map: StateMap): string[] {
  return PL_GPC_ORDER.filter((id) => {
    const s = map[id]?.status;
    return s === "practising" || s === "introduced";
  }).map((id) => NODE_BY_ID[id].grapheme!);
}

export type Phase = "pre-alphabetic" | "partial" | "full" | "consolidated";

/** Derived Ehri phase estimate for the Polish track. */
export function phaseOf(map: StateMap): Phase {
  const gpcs = masteredGraphemes(map).length;
  if (gpcs < 5) return "pre-alphabetic";
  if (!isMastered(map, "pl:CV")) return "partial";
  if (!isMastered(map, "pl:CVC")) return "full";
  return "consolidated";
}

export const PHASE_LABEL_PL: Record<Phase, string> = {
  "pre-alphabetic": "przedalfabetyczna",
  partial: "częściowo alfabetyczna",
  full: "pełna alfabetyczna",
  consolidated: "utrwalona",
};

/** Stage label for the parent area. */
export function stageOf(map: StateMap): string {
  if (isMastered(map, "pl:CVC")) return "PL-3";
  if (isMastered(map, "pl:CV")) return "PL-2";
  const vowels = ["a", "o", "e", "u", "i", "y"].every((v) => isMastered(map, `pl:${v}`));
  return vowels ? "PL-1" : "PL-0";
}
