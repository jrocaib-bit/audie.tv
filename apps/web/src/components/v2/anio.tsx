"use client";

import { resumenAnio } from "@audite/domain";
import { useMemo, useState } from "react";
import { useLibrary } from "@/components/library";
import { Arte } from "@/components/v2/fichas";

export function AnioV2() {
  const library = useLibrary();
  const es = library.settings.uiLocale === "es";
  const [paso, setPaso] = useState(0);
  const resumen = useMemo(() => resumenAnio({
    segundos: Object.values(library.progress.episodes).reduce((suma, episodio) => suma + episodio.positionSeconds, 0),
    libros: Object.keys(library.progress.episodes).map((id) => id.split("-")[0] ?? ""),
    dias: library.progress.listenedOn ?? [],
    hoy: new Date().toISOString().slice(0, 10),
    versiculos: [],
  }), [library.progress]);
  const historias = [
    { titulo: es ? "Minutos" : "Minutes", cifra: String(resumen.minutos), detalle: es ? "este año" : "this year" },
    { titulo: es ? "Libros" : "Books", cifra: String(resumen.libros), detalle: "" },
    { titulo: es ? "Racha" : "Streak", cifra: String(resumen.racha), detalle: es ? "días" : "days" },
    { titulo: es ? "Tu año" : "Your year", cifra: resumen.versiculo ?? (es ? "Génesis" : "Genesis"), detalle: es ? "Comparte la tarjeta" : "Share the card" },
  ];
  const historia = historias[Math.min(paso, historias.length - 1)] ?? historias[0]!;
  return (
    <main className="flex min-h-full flex-col bg-[#100E0C] px-4 py-6 text-[#F4ECE2]" onClick={() => setPaso((valor) => (valor + 1) % historias.length)}>
      <p className="kicker text-[#C9A96E]">{es ? "Tu año en la Biblia" : "Your year in the Bible"}</p>
      <div className="mt-3 flex gap-1">{historias.map((item, indice) => <span key={item.titulo} className={`h-0.5 flex-1 ${indice <= paso ? "bg-[#C9A96E]" : "bg-white/20"}`} />)}</div>
      <div className="mt-8 overflow-hidden rounded-3xl">
        <Arte episodioId="gn-01" className="h-52 w-full" />
      </div>
      <p className="mt-6 text-sm text-[#B7AB9C]">{historia.titulo}</p>
      <h1 className="font-display text-7xl leading-none">{historia.cifra}</h1>
      <p className="mt-2 text-lg">{historia.detalle}</p>
    </main>
  );
}
