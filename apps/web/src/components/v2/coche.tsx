"use client";

import { formatClock, nombreCorto, playableEpisodes } from "@audite/domain";
import { useLibrary } from "@/components/library";

export function CocheV2() {
  const library = useLibrary();
  const es = library.settings.uiLocale === "es";
  const episode = playableEpisodes(library.catalog)[0] ?? null;
  const tiempo = library.player.globalTime;
  return (
    <main className="flex min-h-dvh flex-col bg-[#100E0C] px-4 py-6 text-[#F4ECE2]">
      <p className="font-display text-3xl leading-tight">{episode ? nombreCorto(episode, library.settings.uiLocale) : "Audite"}</p>
      <p className="mt-1 text-lg text-[#E0C48A]">{formatClock(tiempo)}</p>
      <div className="mt-8 grid flex-1 grid-cols-2 gap-3">
        <button type="button" aria-label={library.player.status === "playing" ? (es ? "Pausa" : "Pause") : (es ? "Oír" : "Play")} className="flex min-h-28 items-center justify-center rounded-3xl bg-[#F4ECE2] text-[#100E0C]" onClick={() => episode && (library.player.status === "playing" ? library.toggle() : library.playEpisode(episode.id))}>
          <svg viewBox="0 0 24 24" className="size-16" aria-hidden="true">{library.player.status === "playing" ? <path fill="currentColor" d="M6 4h4v16H6zM14 4h4v16h-4z" /> : <path fill="currentColor" d="M8 4.5v15l12-7.5z" />}</svg>
        </button>
        <button type="button" aria-label="+15" className="flex min-h-28 items-center justify-center rounded-3xl border border-white/30 text-4xl" onClick={() => library.seekBy(15)}>+15</button>
        <button type="button" aria-label="−15" className="flex min-h-28 items-center justify-center rounded-3xl border border-white/30 text-4xl" onClick={() => library.seekBy(-15)}>−15</button>
        <button type="button" aria-label={es ? "Velocidad" : "Speed"} className="flex min-h-28 items-center justify-center rounded-3xl border border-white/30 font-display text-5xl" onClick={() => library.setRate(library.settings.rate === 1 ? 1.5 : 1)}>{library.settings.rate}×</button>
      </div>
    </main>
  );
}
