// Session composer: turns the learner model into a 5–10 minute session.
// 60% review of due items, 30% items being practised, 10% new material
// (at most 2 new nodes, at most 1 new letter). Interleaved, ends on wins.

import { EN_GATE, NODES, NODE_BY_ID, PL_GPC_ORDER, PL_VOWELS, PL_CONSONANTS, graphemeOf } from "./graph";
import {
  freshState,
  isMastered,
  masteredGraphemes,
  practisingGraphemes,
  type StateMap,
} from "./model";
import { PA_WORDS, WORLDS, DEFAULT_WORLD, decodableWords, type Word } from "./content";

export type Trial =
  | { type: "sound"; node: string; grapheme: string; choices: string[] }
  | { type: "syllable"; node: string; c: string; v: string; target: string; choices: string[] }
  | { type: "word"; node: string; word: Word; choices: Word[] }
  | { type: "sentence"; node: string; text: string; word: Word; choices: Word[] }
  | { type: "pa-clap"; node: string; word: Word }
  | { type: "pa-first"; node: string; sound: string; word: Word; choices: Word[] }
  | { type: "peek"; node: null; word: Word };

export type Session = {
  number: number;
  worldId: string;
  trials: Trial[];
  /** States after introducing new nodes (persist together with results). */
  states: StateMap;
  /** Node ids introduced this session. */
  introduced: string[];
  probe: boolean;
};

export type Rng = () => number;

const MAX_PRACTISING = 6;
const TARGET_TRIALS = 24;

function shuffle<T>(arr: T[], rng: Rng): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const pick = <T,>(arr: T[], rng: Rng): T => arr[Math.floor(rng() * arr.length)];

function prereqsMastered(map: StateMap, nodeId: string): boolean {
  return NODE_BY_ID[nodeId].requires.every((r) => isMastered(map, r));
}

/** Unlocks new nodes whose prerequisites are mastered. Mutates `map`. */
export function introduceNodes(map: StateMap): string[] {
  const introduced: string[] = [];
  const active = () =>
    NODES.filter((n) => ["introduced", "practising"].includes(map[n.id]?.status ?? "locked")).length;
  // PA nodes are always available.
  for (const n of NODES) {
    if (n.kind === "pa" && (map[n.id]?.status ?? "locked") === "locked" && prereqsMastered(map, n.id)) {
      map[n.id] = freshState(n.id, "introduced");
    }
  }
  let newGpc = 0;
  for (const n of NODES) {
    if (introduced.length >= 2 || active() >= MAX_PRACTISING) break;
    if (n.kind === "pa") continue;
    if ((map[n.id]?.status ?? "locked") !== "locked") continue;
    if (!prereqsMastered(map, n.id)) continue;
    if (n.kind === "gpc") {
      if (newGpc >= 1) continue;
      newGpc++;
    }
    map[n.id] = freshState(n.id, "introduced");
    introduced.push(n.id);
  }
  return introduced;
}

function soundTrial(nodeId: string, mastered: string[], practising: string[], rng: Rng, nChoices: number): Trial {
  const g = graphemeOf(nodeId);
  const pool = [...mastered, ...practising].filter((x) => x !== g);
  const fallback = [...PL_VOWELS, ...PL_CONSONANTS].filter((x) => x !== g && !pool.includes(x));
  const distractors = shuffle(pool, rng).slice(0, nChoices - 1);
  while (distractors.length < nChoices - 1 && fallback.length) distractors.push(fallback.shift()!);
  return { type: "sound", node: nodeId, grapheme: g, choices: shuffle([g, ...distractors], rng) };
}

function syllableTrial(nodeId: string, c: string, vowels: string[], words: Word[], rng: Rng): Trial {
  // Prefer a vowel that forms a syllable inside a known word.
  const src = words.find((w) => vowels.some((v) => w.text.includes(c + v)));
  const v = src ? vowels.find((v) => src.text.includes(c + v))! : pick(vowels, rng);
  const target = c + v;
  const others = shuffle(vowels.filter((x) => x !== v), rng).slice(0, 2).map((x) => c + x);
  return { type: "syllable", node: nodeId, c, v, target, choices: shuffle([target, ...others], rng) };
}

function wordTrial(nodeId: string, w: Word, pool: Word[], rng: Rng): Trial | null {
  const others = shuffle(pool.filter((x) => x.text !== w.text), rng).slice(0, 2);
  if (others.length < 2) return null;
  return { type: "word", node: nodeId, word: w, choices: shuffle([w, ...others], rng) };
}

function paClap(rng: Rng): Trial {
  return { type: "pa-clap", node: "pa:syllable-clap", word: pick(PA_WORDS, rng) };
}

function paFirst(rng: Rng, mastered: string[], practising: string[]): Trial {
  // First-sound matching on letters the child is learning, so PA and letters reinforce each other.
  const known = [...practising, ...mastered];
  const candidates = PA_WORDS.filter((w) => known.includes(w.text[0]));
  const target = candidates.length ? pick(candidates, rng) : pick(PA_WORDS, rng);
  const sound = target.text[0];
  const others = shuffle(PA_WORDS.filter((w) => w.text[0] !== sound), rng).slice(0, 2);
  return { type: "pa-first", node: "pa:first-sound", sound, word: target, choices: shuffle([target, ...others], rng) };
}

/** Placement probe for a child with no history: letters + two PA tasks, 3 choices each. */
export function composeProbe(worldId: string, rng: Rng): Session {
  const states: StateMap = {};
  states["pa:syllable-clap"] = freshState("pa:syllable-clap", "introduced");
  states["pa:first-sound"] = freshState("pa:first-sound", "introduced");
  const probeNodes = PL_GPC_ORDER.slice(0, 10);
  const all = probeNodes.map(graphemeOf);
  const trials: Trial[] = [paClap(rng), paClap(rng)];
  for (const id of probeNodes) {
    const g = graphemeOf(id);
    const others = shuffle(all.filter((x) => x !== g), rng).slice(0, 2);
    trials.push({ type: "sound", node: id, grapheme: g, choices: shuffle([g, ...others], rng) });
  }
  trials.push(paFirst(rng, [], all));
  return { number: 1, worldId, trials, states, introduced: [], probe: true };
}

export function compose(map0: StateMap, worldId: string, sessionNumber: number, now: Date, rng: Rng): Session {
  const states: StateMap = Object.fromEntries(Object.entries(map0).map(([k, v]) => [k, { ...v, recent: [...v.recent] }]));
  const introduced = introduceNodes(states);
  const world = WORLDS[worldId] ?? WORLDS[DEFAULT_WORLD];

  const mastered = masteredGraphemes(states);
  const practising = practisingGraphemes(states);
  const vowM = mastered.filter((g) => (PL_VOWELS as readonly string[]).includes(g));
  const { words } = decodableWords(world.id, mastered, practising);

  const byStatus = (s: string[]) => NODES.filter((n) => s.includes(states[n.id]?.status ?? "locked")).map((n) => n.id);
  const dueReview = byStatus(["mastered"])
    .filter((id) => Date.parse(states[id].dueAt) <= now.getTime())
    .sort((a, b) => Date.parse(states[a].dueAt) - Date.parse(states[b].dueAt));
  const practisingIds = byStatus(["practising", "introduced"]);

  const trialFor = (id: string, scaffoldChoices: number): Trial | null => {
    const node = NODE_BY_ID[id];
    if (!node) return null;
    if (node.kind === "pa") return id === "pa:syllable-clap" ? paClap(rng) : paFirst(rng, mastered, practising);
    if (node.kind === "gpc") {
      const g = node.grapheme!;
      const isCons = (PL_CONSONANTS as readonly string[]).includes(g);
      // Consonant with enough vowels: blend it; otherwise plain sound → letter.
      if (isCons && vowM.length >= 3 && states["pl:CV"] && rng() < 0.5) return syllableTrial(id, g, vowM, words, rng);
      // Letter inside a readable word, sometimes.
      const inWord = words.filter((w) => w.requires.includes(g));
      if (inWord.length && words.length >= 3 && isMastered(states, "pl:CV") && rng() < 0.4) {
        return wordTrial(id, pick(inWord, rng), words, rng);
      }
      return soundTrial(id, mastered, practising, rng, scaffoldChoices);
    }
    if (id === "pl:CV") {
      const cons = mastered.filter((g) => (PL_CONSONANTS as readonly string[]).includes(g));
      if (!cons.length || vowM.length < 2) return null;
      return syllableTrial(id, pick(cons, rng), vowM, words, rng);
    }
    // CVCV / CVC: words of that shape, sentences once there are enough.
    const shape = id === "pl:CVCV" ? (w: Word) => w.text.length === 4 : (w: Word) => w.text.length === 3;
    const pool = words.filter(shape);
    if (pool.length >= 3 && isMastered(states, "pl:CVCV") && rng() < 0.3) {
      const w = pick(pool, rng);
      const other = pick(pool.filter((x) => x.text !== w.text), rng);
      return { type: "sentence", node: id, text: pick(world.frames, rng).replace("{w}", w.text), word: w, choices: shuffle([w, other], rng) };
    }
    if (pool.length >= 3) return wordTrial(id, pick(pool, rng), pool, rng);
    if (words.length >= 3) return wordTrial(id, pick(words, rng), words, rng);
    return null;
  };

  const trials: Trial[] = [];
  const push = (id: string, n: number) => {
    const st = states[id];
    const choices = st && st.streak >= 3 ? 4 : st && st.streak >= 1 ? 3 : 2;
    for (let i = 0; i < n; i++) {
      const t = trialFor(id, Math.max(2, choices));
      if (t) trials.push(t);
    }
  };

  // New nodes: 3 retrievals each. Other practising: 2 each. Due reviews: 1 each.
  introduced.forEach((id) => push(id, 3));
  practisingIds.filter((id) => !introduced.includes(id)).forEach((id) => push(id, 2));
  const reviewBudget = Math.max(6, TARGET_TRIALS - trials.length);
  dueReview.slice(0, reviewBudget).forEach((id) => push(id, 1));
  // Top up with mastered reviews if the session is thin.
  const masteredIds = byStatus(["mastered"]);
  let guard = 0;
  while (trials.length < 12 && masteredIds.length && guard++ < 20) push(pick(masteredIds, rng), 1);

  let main = shuffle(trials, rng).slice(0, TARGET_TRIALS + 4);

  // One "peek" at a world word the child cannot read yet, picture + audio only.
  const beyond = world.words.filter((w) => !words.some((x) => x.text === w.text));
  if (beyond.length && main.length >= 6) main.splice(Math.floor(main.length / 2), 0, { type: "peek", node: null, word: pick(beyond, rng) });

  // Always end on three known-correct items.
  const easy = masteredIds.filter((id) => NODE_BY_ID[id].kind === "gpc");
  const tail: Trial[] = easy.length
    ? [0, 1, 2].map(() => soundTrial(pick(easy, rng), mastered, practising, rng, 2))
    : [];
  main = [...main, ...tail];

  return { number: sessionNumber, worldId: world.id, trials: main, states, introduced, probe: false };
}

export function englishUnlocked(map: StateMap): boolean {
  return EN_GATE.every((id) => isMastered(map, id));
}
