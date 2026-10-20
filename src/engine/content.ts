// Content layer: worlds (themes) are a filter over decodability-tagged words.
// A theme chooses which readable words and pictures the child sees; it never
// decides whether a word is readable. Polish only for now.

export type Word = {
  id: string;
  text: string;
  pic: string;
  /** Distinct graphemes the word needs. */
  requires: string[];
  /** Syllables, for clapping tasks. */
  syllables: string[];
};

export type CollectionItem = { name: string; pic: string; fact: string };

export type World = {
  id: string;
  name: string;
  mascot: string;
  /** Tailwind classes for the stage background and accent. */
  bg: string;
  accent: string;
  chip: string;
  words: Word[];
  frames: string[];
  collection: CollectionItem[];
};

function word(text: string, pic: string, syl: string): Word {
  return {
    id: `w:${text}`,
    text,
    pic,
    requires: [...new Set(text.split(""))],
    syllables: syl.split("-"),
  };
}

export const WORLDS: Record<string, World> = {
  kosmos: {
    id: "kosmos",
    name: "Kosmos",
    mascot: "🚀",
    bg: "from-indigo-900 to-slate-900",
    accent: "bg-amber-300 text-slate-900",
    chip: "bg-indigo-800 text-white",
    words: [
      word("lot", "🛫", "lot"), word("tor", "🛤️", "tor"), word("kula", "🪐", "ku-la"), word("mapa", "🗺️", "ma-pa"),
      word("koło", "🛞", "ko-ło"), word("noc", "🌙", "noc"), word("mars", "🔴", "mars"), word("ufo", "🛸", "u-fo"),
      word("rura", "🪈", "ru-ra"), word("pilot", "👨‍🚀", "pi-lot"), word("rakieta", "🚀", "ra-kie-ta"),
      word("kometa", "☄️", "ko-me-ta"), word("sonda", "🛰️", "son-da"),
    ],
    frames: ["To {w}.", "Tu jest {w}.", "Pilot ma {w}."],
    collection: [
      { name: "Mars", pic: "🔴", fact: "Mars jest czerwony." },
      { name: "Luna", pic: "🌕", fact: "Luna to Księżyc." },
      { name: "Sol", pic: "☀️", fact: "Sol to Słońce." },
      { name: "Saturn", pic: "🪐", fact: "Saturn ma pierścienie." },
      { name: "Kometa", pic: "☄️", fact: "Kometa ma ogon." },
      { name: "Wenus", pic: "🌕", fact: "Wenus jest gorąca." },
      { name: "Jowisz", pic: "🟠", fact: "Jowisz jest największy." },
      { name: "Pluton", pic: "⚪", fact: "Pluton jest malutki." },
    ],
  },
  dino: {
    id: "dino",
    name: "Dinozaury",
    mascot: "🦕",
    bg: "from-lime-200 to-emerald-100",
    accent: "bg-green-600 text-white",
    chip: "bg-white text-green-900",
    words: [
      word("jajo", "🥚", "ja-jo"), word("las", "🌲", "las"), word("łapa", "🐾", "ła-pa"), word("kły", "🦷", "kły"),
      word("ogon", "🦎", "o-gon"), word("dino", "🦕", "di-no"), word("rogi", "🐂", "ro-gi"), word("lawa", "🌋", "la-wa"),
      word("mama", "🦖", "ma-ma"), word("tata", "🦖", "ta-ta"), word("kamyk", "🪨", "ka-myk"), word("paproć", "🌿", "pa-proć"),
      word("skała", "⛰️", "ska-ła"), word("mamut", "🦣", "ma-mut"),
    ],
    frames: ["To {w}.", "Dino ma {w}.", "Tu jest {w}."],
    collection: [
      { name: "Dino", pic: "🦕", fact: "Dino lubi jeść liście." },
      { name: "Rapt", pic: "🦖", fact: "Rapt biega szybko." },
      { name: "Mamut", pic: "🦣", fact: "Mamut ma futro." },
      { name: "Diplodok", pic: "🦕", fact: "Diplodok ma długą szyję." },
      { name: "Stegozaur", pic: "🦕", fact: "Stegozaur ma płyty na grzbiecie." },
      { name: "Triceratops", pic: "🦏", fact: "Triceratops ma trzy rogi." },
      { name: "Tyranozaur", pic: "🦖", fact: "Tyranozaur ma wielkie kły." },
      { name: "Pterodaktyl", pic: "🦅", fact: "Pterodaktyl lata." },
    ],
  },
  zwierzeta: {
    id: "zwierzeta",
    name: "Zwierzęta",
    mascot: "🐱",
    bg: "from-orange-200 to-amber-100",
    accent: "bg-orange-500 text-white",
    chip: "bg-white text-orange-900",
    words: [
      word("kot", "🐱", "kot"), word("lis", "🦊", "lis"), word("osa", "🐝", "o-sa"), word("ul", "🐝", "ul"),
      word("rak", "🦀", "rak"), word("sowa", "🦉", "so-wa"), word("kura", "🐔", "ku-ra"), word("ryba", "🐟", "ry-ba"),
      word("pies", "🐶", "pies"), word("koty", "🐈", "ko-ty"), word("lama", "🦙", "la-ma"), word("małpa", "🐒", "mał-pa"),
      word("byk", "🐂", "byk"), word("sarna", "🦌", "sar-na"),
    ],
    frames: ["To {w}.", "Tu jest {w}.", "Mama ma {w}."],
    collection: [
      { name: "Kot", pic: "🐱", fact: "Kot mruczy." },
      { name: "Lis", pic: "🦊", fact: "Lis ma rudy ogon." },
      { name: "Sowa", pic: "🦉", fact: "Sowa nie śpi w nocy." },
      { name: "Lama", pic: "🦙", fact: "Lama pluje." },
      { name: "Sarna", pic: "🦌", fact: "Sarna mieszka w lesie." },
      { name: "Małpa", pic: "🐒", fact: "Małpa skacze po drzewach." },
      { name: "Żyrafa", pic: "🦒", fact: "Żyrafa ma długą szyję." },
      { name: "Hipopotam", pic: "🦛", fact: "Hipopotam lubi wodę." },
    ],
  },
};

export const DEFAULT_WORLD = "zwierzeta";

/** Neutral words: used only when the world has too few decodable items. */
export const NEUTRAL_WORDS: Word[] = [
  word("dom", "🏠", "dom"), word("sok", "🧃", "sok"), word("nos", "👃", "nos"), word("oko", "👁️", "o-ko"),
  word("lala", "🪆", "la-la"), word("lody", "🍦", "lo-dy"), word("buty", "👟", "bu-ty"), word("ser", "🧀", "ser"),
  word("mak", "🌸", "mak"), word("tama", "🏞️", "ta-ma"), word("mapa", "🗺️", "ma-pa"), word("lato", "☀️", "la-to"),
];

/** Words for phonological-awareness tasks: spoken only, so no decodability needed. */
export const PA_WORDS: Word[] = [
  word("mama", "👩", "ma-ma"), word("tata", "👨", "ta-ta"), word("kot", "🐱", "kot"), word("sowa", "🦉", "so-wa"),
  word("lody", "🍦", "lo-dy"), word("auto", "🚗", "au-to"), word("banan", "🍌", "ba-nan"), word("dom", "🏠", "dom"),
  word("ryba", "🐟", "ry-ba"), word("motyl", "🦋", "mo-tyl"), word("jabłko", "🍎", "jabł-ko"), word("słoń", "🐘", "słoń"),
  word("rower", "🚲", "ro-wer"), word("piłka", "⚽", "pił-ka"), word("kura", "🐔", "ku-ra"), word("noga", "🦵", "no-ga"),
  word("truskawka", "🍓", "tru-skaw-ka"), word("parasol", "☂️", "pa-ra-sol"), word("kanapka", "🥪", "ka-nap-ka"),
  word("lampa", "💡", "lam-pa"), word("wąż", "🐍", "wąż"), word("ul", "🐝", "ul"), word("oko", "👁️", "o-ko"),
];

/**
 * A word is decodable when every grapheme it needs is mastered, or at most one
 * is currently being practised (that is how the current target shows up in context).
 */
export function isDecodable(w: Word, mastered: string[], practising: string[]): boolean {
  const unknown = w.requires.filter((g) => !mastered.includes(g));
  return unknown.every((g) => practising.includes(g)) && unknown.length <= 1;
}

export function decodableWords(worldId: string, mastered: string[], practising: string[]): {
  words: Word[];
  fromWorld: boolean;
} {
  const world = WORLDS[worldId] ?? WORLDS[DEFAULT_WORLD];
  const themed = world.words.filter((w) => isDecodable(w, mastered, practising));
  if (themed.length >= 3) return { words: themed, fromWorld: true };
  const neutral = NEUTRAL_WORDS.filter((w) => isDecodable(w, mastered, practising));
  const seen = new Set(themed.map((w) => w.text));
  return { words: [...themed, ...neutral.filter((w) => !seen.has(w.text))], fromWorld: false };
}
