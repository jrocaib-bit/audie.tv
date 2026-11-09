"use client";

import { formatClock, nombreCorto, playableEpisodes } from "@audite/domain";
import { useLibrary } from "@/components/library";

export function CocheV2() {
  const library = useLibrary();
  const es = library.settings.uiLocale === "es";
  const episode = playableEpisodes(library.catalog)[0] ?? null;
  const tiempo = library.player.globalTime;
  return (
    <main className="flex min-h-full flex-col bg-[#100E0C] px-4 py-6 text-[#F4ECE2]">
      <p className="font-display text-3xl leading-tight">{episode ? nombreCorto(episode, library.settings.uiLocale) : "Audite"}</p>
      <p className="mt-1 text-lg text-[#E0C48A]">{formatClock(tiempo)}</p>
      <div className="mt-8 grid flex-1 grid-cols-2 gap-3">
        <button type="button" className="min-h-28 rounded-3xl bg-[#F4ECE2] text-3xl text-[#100E0C]" onClick={() => episode && library.playEpisode(episode.id)}>{library.player.status === "playing" ? (es ? "Pausa" : "Pause") : (es ? "Oír" : "Play")}</button>
        <button type="button" className="min-h-28 rounded-3xl border border-white/30 text-3xl" onClick={() => library.seekBy(15)}>+15</button>
        <button type="button" className="min-h-28 rounded-3xl border border-white/30 text-3xl" onClick={() => library.seekBy(-15)}>−15</button>
        <button type="button" className="min-h-28 rounded-3xl border border-white/30 text-3xl" onClick={() => library.setRate(library.settings.rate === 1 ? 1.5 : 1)}>{library.settings.rate}×</button>
      </div>
    </main>
  );
}
