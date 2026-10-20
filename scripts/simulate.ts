// Simulates a child using the engine for N sessions and prints what happens.
// Run: npx tsx scripts/simulate.ts [sessions] [skill 0..1]
import { compose, composeProbe } from "../src/engine/composer";
import { evaluateProbe, evaluateSession, type TrialResult } from "../src/engine/evaluate";
import { masteredGraphemes, practisingGraphemes, phaseOf, stageOf, type StateMap } from "../src/engine/model";

const sessions = Number(process.argv[2] ?? 30);
const skill = Number(process.argv[3] ?? 0.85);
let seed = 42;
const rng = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);

let now = new Date("2026-10-21T17:00:00Z");
let states: StateMap = {};

// Child knows a, o, m at the start (typical 4-year-old).
const known = new Set(["a", "o", "m"]);
const answer = (node: string, type: string): boolean => {
  const g = node.split(":")[1];
  if (type.startsWith("pa")) return rng() < 0.9;
  if (known.has(g)) return rng() < 0.97;
  return rng() < skill;
};

const probe = composeProbe("dino", rng);
const probeResults: TrialResult[] = probe.trials
  .filter((t) => t.node)
  .map((t) => ({ node: t.node!, type: t.type, ok: answer(t.node!, t.type), ms: 1200 + rng() * 1200, t: now.toISOString() }));
states = evaluateProbe(probeResults, now);
console.log("after probe: practising", practisingGraphemes(states).join(" "));

for (let s = 2; s <= sessions; s++) {
  now = new Date(now.getTime() + (s % 3 === 0 ? 2 : 1) * 86_400_000); // ~every 1–2 days
  const sess = compose(states, "dino", s, now, rng);
  const results: TrialResult[] = [];
  const counts: Record<string, number> = {};
  for (const t of sess.trials) {
    counts[t.type] = (counts[t.type] ?? 0) + 1;
    if (!t.node) continue;
    const g = t.node.split(":")[1];
    const ok = answer(t.node, t.type);
    if (ok && rng() < 0.3) known.add(g); // learning happens
    results.push({ node: t.node, type: t.type, ok, ms: 900 + rng() * 1500, t: new Date(now.getTime() + results.length * 15000).toISOString() });
  }
  states = evaluateSession(sess.states, results, s);
  const acc = Math.round((100 * results.filter((r) => r.ok).length) / Math.max(1, results.length));
  console.log(
    `s${String(s).padStart(2)} ${now.toISOString().slice(0, 10)} trials=${sess.trials.length} acc=${acc}% new=[${sess.introduced.join(",")}] ` +
      `M=${masteredGraphemes(states).join("")} P=${practisingGraphemes(states).join("")} ${stageOf(states)} ${phaseOf(states)} ` +
      JSON.stringify(counts),
  );
}
