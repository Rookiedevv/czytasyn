// Audio helpers for iPad Safari.
//
// iOS refuses to play any sound until the page has been tapped once. We keep a
// single AudioContext, resume it inside the first user gesture, and keep it
// warm with a short silent buffer. Speech synthesis is used for the lesson
// voice until recorded audio is added.

import type { Lang } from "@/engine/graph";

let ctx: AudioContext | null = null;
let unlocked = false;

export function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  return ctx;
}

/** Call from inside a tap/click handler. Safe to call many times. */
export async function unlockAudio(): Promise<void> {
  const c = getAudioContext();
  if (!c) return;
  if (c.state === "suspended") {
    try {
      await c.resume();
    } catch {
      /* ignore */
    }
  }
  if (!unlocked) {
    // Play one silent sample: the classic WebKit trick that fully opens output.
    const buffer = c.createBuffer(1, 1, 22050);
    const source = c.createBufferSource();
    source.buffer = buffer;
    source.connect(c.destination);
    source.start(0);
    unlocked = true;
  }
  // Warm up speech synthesis too; iOS needs the first utterance in a gesture.
  if ("speechSynthesis" in window) {
    window.speechSynthesis.getVoices();
  }
}

const LANG_TAG: Record<Lang, string> = { pl: "pl-PL", en: "en-GB" };

function pickVoice(lang: Lang): SpeechSynthesisVoice | undefined {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const tag = LANG_TAG[lang];
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((v) => v.lang === tag && /enhanced|premium/i.test(v.name)) ??
    voices.find((v) => v.lang === tag) ??
    voices.find((v) => v.lang.startsWith(lang))
  );
}

/** Speak a short phrase in the child's language. Resolves when finished. */
export function speak(text: string, lang: Lang, rate = 0.85): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      resolve();
      return;
    }
    const synth = window.speechSynthesis;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = LANG_TAG[lang];
    u.rate = rate;
    u.pitch = 1.05;
    const voice = pickVoice(lang);
    if (voice) u.voice = voice;
    u.onend = () => resolve();
    u.onerror = () => resolve();
    synth.speak(u);
    // Safety net: iOS sometimes drops onend.
    setTimeout(resolve, 4000);
  });
}

/** Little reward sounds generated with the Web Audio API: no files needed. */
export function playTone(kind: "correct" | "wrong" | "win") {
  const c = getAudioContext();
  if (!c) return;
  const now = c.currentTime;
  const notes =
    kind === "correct" ? [523, 659, 784] : kind === "win" ? [523, 659, 784, 1047] : [220, 180];
  notes.forEach((freq, i) => {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = kind === "wrong" ? "sawtooth" : "sine";
    osc.frequency.value = freq;
    const t = now + i * (kind === "wrong" ? 0.18 : 0.12);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
    osc.connect(gain).connect(c.destination);
    osc.start(t);
    osc.stop(t + 0.3);
  });
}
