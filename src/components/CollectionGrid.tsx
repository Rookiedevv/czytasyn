"use client";

import type { World } from "@/engine/content";
import { speakSeq, unlockAudio } from "@/lib/audio";

/** Highlights the letters the child already knows inside a name. */
export function Markup({ text, known }: { text: string; known: string[] }) {
  return (
    <span>
      {text.split("").map((l, i) => (
        <span
          key={i}
          className={known.includes(l.toLowerCase()) ? "rounded-md bg-emerald-200 px-0.5 text-slate-900" : "opacity-50"}
        >
          {l}
        </span>
      ))}
    </span>
  );
}

export default function CollectionGrid({ world, unlocked, known }: { world: World; unlocked: number; known: string[] }) {
  return (
    <div className="flex flex-wrap justify-center gap-5">
      {world.collection.map((item, k) =>
        k < unlocked ? (
          <button
            key={item.name}
            onClick={async () => {
              await unlockAudio();
              speakSeq([item.name, item.fact], "pl", 0.9);
            }}
            className="flex w-44 flex-col items-center gap-2 rounded-[2rem] bg-white p-5 shadow-xl active:scale-95"
          >
            <span className="text-6xl">{item.pic}</span>
            <span className="text-2xl font-bold">
              <Markup text={item.name} known={known} />
            </span>
          </button>
        ) : (
          <div key={item.name} className="flex w-44 flex-col items-center gap-2 rounded-[2rem] bg-white/40 p-5 text-slate-500">
            <span className="text-6xl">?</span>
            <span className="text-sm">sesja {k + 1}</span>
          </div>
        ),
      )}
    </div>
  );
}
