// Lesson content for Czytasyn.
//
// Method notes (v1):
// - Polish follows the syllabic/phonic order used by Polish primers: vowels
//   first, then the easiest consonants (m, t, l, k, d), then open syllables
//   (ma, mo, ta...) which Polish children blend into first words.
// - English follows a synthetic-phonics order (s a t p i n m d ...): the first
//   six letters already allow blending real CVC words (sat, pin, tap).
// - Every item has a picture word so the child hears the sound in context.
//
// TODO: replace speech synthesis with recorded phoneme audio in /public/audio.

export type Lang = "pl" | "en";

export type LessonItem = {
  /** What the child must recognise: a letter or a syllable. */
  text: string;
  /** Example word starting with (or containing) the sound. */
  word: string;
  /** Picture for the example word. */
  emoji: string;
};

export type Lesson = {
  id: string;
  lang: Lang;
  title: string;
  kind: "letters" | "syllables";
  items: LessonItem[];
};

export const LESSONS: Lesson[] = [
  // ---------------------------------------------------------------- Polish
  {
    id: "pl-1-samogloski",
    lang: "pl",
    title: "Samogłoski",
    kind: "letters",
    items: [
      { text: "a", word: "ananas", emoji: "🍍" },
      { text: "o", word: "oko", emoji: "👁️" },
      { text: "e", word: "ekran", emoji: "📺" },
      { text: "u", word: "ul", emoji: "🐝" },
      { text: "i", word: "igła", emoji: "🪡" },
    ],
  },
  {
    id: "pl-2-spolgloski-1",
    lang: "pl",
    title: "M, T, L, K",
    kind: "letters",
    items: [
      { text: "m", word: "mama", emoji: "👩" },
      { text: "t", word: "tata", emoji: "👨" },
      { text: "l", word: "lala", emoji: "🪆" },
      { text: "k", word: "kot", emoji: "🐱" },
      { text: "a", word: "ananas", emoji: "🍍" },
      { text: "o", word: "oko", emoji: "👁️" },
    ],
  },
  {
    id: "pl-3-sylaby-1",
    lang: "pl",
    title: "Sylaby: ma, mo, ta, to",
    kind: "syllables",
    items: [
      { text: "ma", word: "mama", emoji: "👩" },
      { text: "mo", word: "motyl", emoji: "🦋" },
      { text: "ta", word: "tata", emoji: "👨" },
      { text: "to", word: "tort", emoji: "🎂" },
      { text: "la", word: "lala", emoji: "🪆" },
      { text: "ko", word: "kot", emoji: "🐱" },
    ],
  },
  {
    id: "pl-4-spolgloski-2",
    lang: "pl",
    title: "D, S, B, P, N",
    kind: "letters",
    items: [
      { text: "d", word: "dom", emoji: "🏠" },
      { text: "s", word: "sok", emoji: "🧃" },
      { text: "b", word: "but", emoji: "👟" },
      { text: "p", word: "pies", emoji: "🐶" },
      { text: "n", word: "nos", emoji: "👃" },
      { text: "r", word: "rak", emoji: "🦀" },
    ],
  },
  {
    id: "pl-5-sylaby-2",
    lang: "pl",
    title: "Sylaby: do, so, bu, pi",
    kind: "syllables",
    items: [
      { text: "do", word: "dom", emoji: "🏠" },
      { text: "so", word: "sok", emoji: "🧃" },
      { text: "bu", word: "but", emoji: "👟" },
      { text: "pi", word: "pies", emoji: "🐶" },
      { text: "no", word: "nos", emoji: "👃" },
      { text: "ra", word: "rak", emoji: "🦀" },
    ],
  },

  // --------------------------------------------------------------- English
  {
    id: "en-1-satp",
    lang: "en",
    title: "s, a, t, p",
    kind: "letters",
    items: [
      { text: "s", word: "sun", emoji: "☀️" },
      { text: "a", word: "apple", emoji: "🍎" },
      { text: "t", word: "tap", emoji: "🚰" },
      { text: "p", word: "pig", emoji: "🐷" },
    ],
  },
  {
    id: "en-2-inmd",
    lang: "en",
    title: "i, n, m, d",
    kind: "letters",
    items: [
      { text: "i", word: "igloo", emoji: "🧊" },
      { text: "n", word: "nest", emoji: "🪺" },
      { text: "m", word: "map", emoji: "🗺️" },
      { text: "d", word: "dog", emoji: "🐶" },
      { text: "s", word: "sun", emoji: "☀️" },
      { text: "a", word: "apple", emoji: "🍎" },
    ],
  },
  {
    id: "en-3-gock",
    lang: "en",
    title: "g, o, c, k",
    kind: "letters",
    items: [
      { text: "g", word: "goat", emoji: "🐐" },
      { text: "o", word: "octopus", emoji: "🐙" },
      { text: "c", word: "cat", emoji: "🐱" },
      { text: "k", word: "kite", emoji: "🪁" },
      { text: "t", word: "tap", emoji: "🚰" },
      { text: "p", word: "pig", emoji: "🐷" },
    ],
  },
  {
    id: "en-4-eurh",
    lang: "en",
    title: "e, u, r, h",
    kind: "letters",
    items: [
      { text: "e", word: "egg", emoji: "🥚" },
      { text: "u", word: "umbrella", emoji: "☂️" },
      { text: "r", word: "rabbit", emoji: "🐰" },
      { text: "h", word: "hat", emoji: "🎩" },
      { text: "b", word: "bus", emoji: "🚌" },
      { text: "f", word: "fish", emoji: "🐟" },
    ],
  },
  {
    id: "en-5-blend",
    lang: "en",
    title: "First words",
    kind: "syllables",
    items: [
      { text: "sat", word: "sat", emoji: "🪑" },
      { text: "pin", word: "pin", emoji: "📌" },
      { text: "tap", word: "tap", emoji: "🚰" },
      { text: "map", word: "map", emoji: "🗺️" },
      { text: "dog", word: "dog", emoji: "🐶" },
      { text: "sun", word: "sun", emoji: "☀️" },
    ],
  },
];

export function lessonsFor(lang: Lang): Lesson[] {
  return LESSONS.filter((l) => l.lang === lang);
}

export function getLesson(id: string): Lesson | undefined {
  return LESSONS.find((l) => l.id === id);
}

/** Text shown in the child's screens. Kept minimal on purpose: the child
 *  can't read yet, so the UI relies on pictures, colour and sound. */
export const UI: Record<Lang, Record<string, string>> = {
  pl: {
    listen: "Posłuchaj",
    whichOne: "Który to?",
    great: "Super!",
    tryAgain: "Spróbuj jeszcze raz",
    done: "Brawo!",
    again: "Jeszcze raz",
    back: "Wróć",
    thisIs: "To jest",
    like: "jak",
  },
  en: {
    listen: "Listen",
    whichOne: "Which one?",
    great: "Great!",
    tryAgain: "Try again",
    done: "Well done!",
    again: "Again",
    back: "Back",
    thisIs: "This is",
    like: "like",
  },
};

export const AVATARS = ["🦊", "🐼", "🦄", "🐸", "🦖", "🐙", "🐧", "🦁", "🐨", "🚀", "🌈", "⭐"];

export const THEMES: Record<string, { name: string; bg: string; accent: string }> = {
  forest: { name: "Las", bg: "from-emerald-200 to-lime-100", accent: "bg-emerald-500" },
  ocean: { name: "Ocean", bg: "from-sky-200 to-cyan-100", accent: "bg-sky-500" },
  space: { name: "Kosmos", bg: "from-indigo-300 to-violet-200", accent: "bg-indigo-500" },
  candy: { name: "Słodycze", bg: "from-pink-200 to-rose-100", accent: "bg-pink-500" },
  dino: { name: "Dinozaury", bg: "from-amber-200 to-orange-100", accent: "bg-amber-500" },
};
