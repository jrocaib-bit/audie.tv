"use client";

import { useLibrary } from "@/components/library";
import { Arte } from "@/components/v2/fichas";

export function WidgetV2() {
  const { settings, catalog } = useLibrary();
  const es = settings.uiLocale === "es";
  const episodio = catalog.episodes[0];
  return (
    <main id="contenido" className="app-clear mx-auto w-full max-w-lg px-4 pt-4">
      <h1 className="font-display text-4xl leading-none">{es ? "En el inicio" : "Home screen"}</h1>
      <div className="mt-6 rounded-[2rem] bg-[#0C0B09] p-4">
        <div className="flex items-center gap-3 rounded-2xl bg-[#1B1815] p-3 text-[#F4ECE2]">
          <Arte episodioId={episodio?.id ?? "gn-01"} className="size-16 rounded-xl" />
          <div className="min-w-0 flex-1">
            <p className="font-display text-lg leading-tight">{episodio?.title ?? "Audite"}</p>
            <p className="whitespace-nowrap text-sm text-[#B7AB9C]">{episodio?.scriptureRangeLabel}</p>
          </div>
          <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-[#C9A96E] text-[#100E0C]">▶</span>
        </div>
        <div className="mt-3 rounded-3xl bg-[#1B1815] px-3 py-3 text-sm text-[#F4ECE2]">
          <div className="flex items-center gap-3">
            <Arte episodioId={episodio?.id ?? "gn-01"} className="size-8 shrink-0 rounded-full" />
            <span className="leading-tight">{episodio?.title ?? "Audite"}</span>
          </div>
          <span className="mt-2 block h-1 overflow-hidden rounded-full bg-white/15"><span className="block h-full w-1/3 bg-[#C9A96E]" /></span>
        </div>
      </div>
    </main>
  );
}
