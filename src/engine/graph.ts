// Skill graph: the static, teachable units of the Polish track (PL-0 → PL-2)
// and the English gate. Based on "Reading Progression Engine — Evidence Base
// and Design": phoneme-first, vowels first, open CV syllables as the first
// blending unit, consonants frequency-ordered with confusable neighbours apart.

export type Lang = "pl" | "en";

export type NodeKind = "gpc" | "pattern" | "pa";

export type SkillNode = {
  id: string; // "pl:m", "pl:CV", "pa:syllable-blend"
  lang: Lang | "pa";
  kind: NodeKind;
  /** Grapheme for gpc nodes. */
  grapheme?: string;
  /** Prerequisite node ids. */
  requires: string[];
  /** Latency threshold (ms) for mastery. */
  latencyMs: number;
  stage: string;
};

export const PL_VOWELS = ["a", "o", "e", "u", "i", "y"] as const;
export const PL_CONSONANTS = ["m", "t", "l", "p", "s", "d", "k", "b", "n", "w", "r", "j", "ł"] as const;

/** How to voice an isolated sound with speech synthesis (recordings later). */
export const SAY_PL: Record<string, string> = {
  a: "aaa", o: "ooo", e: "eee", u: "uuu", i: "iii", y: "yyy",
  m: "mmm", t: "t", l: "lll", p: "p", s: "sss", d: "d", k: "k",
  b: "b", n: "nnn", w: "www", r: "rrr", j: "jjj", ł: "łłł",
};

const nodes: SkillNode[] = [];

// PA strand (shared, language-neutral). Syllable level first, then first sound.
nodes.push(
  { id: "pa:syllable-clap", lang: "pa", kind: "pa", requires: [], latencyMs: 4000, stage: "PL-0" },
  { id: "pa:first-sound", lang: "pa", kind: "pa", requires: ["pa:syllable-clap"], latencyMs: 4000, stage: "PL-0" },
);

// PL-0: vowels, in order. Each vowel requires the previous one so new material arrives one at a time.
PL_VOWELS.forEach((v, i) => {
  nodes.push({
    id: `pl:${v}`,
    lang: "pl",
    kind: "gpc",
    grapheme: v,
    requires: i === 0 ? [] : [`pl:${PL_VOWELS[i - 1]}`],
    latencyMs: 2000,
    stage: "PL-0",
  });
});

// PL-1: consonants. The first consonant needs 3 vowels (enough for CV blending);
// each later consonant needs the previous one.
PL_CONSONANTS.forEach((c, i) => {
  nodes.push({
    id: `pl:${c}`,
    lang: "pl",
    kind: "gpc",
    grapheme: c,
    requires: i === 0 ? ["pl:a", "pl:o", "pl:u"] : [`pl:${PL_CONSONANTS[i - 1]}`],
    latencyMs: 2000,
    stage: "PL-1",
  });
});

// Blending patterns.
nodes.push(
  { id: "pl:CV", lang: "pl", kind: "pattern", requires: ["pl:m", "pl:t"], latencyMs: 2000, stage: "PL-1" },
  { id: "pl:CVCV", lang: "pl", kind: "pattern", requires: ["pl:CV", "pl:l"], latencyMs: 3000, stage: "PL-2" },
  { id: "pl:CVC", lang: "pl", kind: "pattern", requires: ["pl:CVCV", "pl:k", "pl:s"], latencyMs: 3000, stage: "PL-2" },
);

export const NODES: SkillNode[] = nodes;
export const NODE_BY_ID: Record<string, SkillNode> = Object.fromEntries(nodes.map((n) => [n.id, n]));

/** Teaching order for PL gpc nodes (used by the placement probe and the parent map). */
export const PL_GPC_ORDER: string[] = [...PL_VOWELS, ...PL_CONSONANTS].map((g) => `pl:${g}`);

/** Which Polish nodes must be mastered before English unlocks. */
export const EN_GATE = ["pl:CVC"];

export function graphemeOf(nodeId: string): string {
  return NODE_BY_ID[nodeId]?.grapheme ?? nodeId.split(":")[1];
}
