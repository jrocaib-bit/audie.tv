"use client";

import { COLOR_HEX, diaLiturgico, fraccionReto, inicioDelPasaje, racha, referenciaPaso, type Reto } from "@audite/domain";
import { obraWebp, obrasVisibles } from "@audite/content/obras";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useSyncExternalStore } from "react";
import { useLibrary } from "@/components/library";
import { fechaDeCuando, isoLocal } from "@/lib/cuando";
import { Candado } from "@/components/v2/fichas";
import { leerRetos, marcarDia, suscribirRetos } from "@/components/v2/retos-local";

const vacio = leerRetos();

function portada(id: string | null) {
  return obrasVisibles().find((obra) => obra.episodio === id) ?? null;
}

export function RetoV2({ reto }: { reto: Reto }) {
  const library = useLibrary();
  const { settings } = library;
  const locale = settings.uiLocale;
  const es = locale === "es";
  const cuando = useSearchParams().get("cuando");
  const fecha = useMemo(() => fechaDeCuando(cuando), [cuando]);
  const hoy = isoLocal(fecha);
  const dia = diaLiturgico(fecha);
  const guardado = useSyncExternalStore(suscribirRetos, leerRetos, () => vacio);
  const estado = guardado[reto.id] ?? { hechos: [], fechas: [] };
  const avance = fraccionReto(estado.hechos, reto.pasos.length);
  const dias = racha(estado.fechas, hoy);
  const siguiente = reto.pasos.find((paso) => !estado.hechos.includes(paso.dia))?.dia ?? 1;
  const obra = portada(reto.obra) ?? portada(reto.pasos[0]?.obra ?? null);
  const mismo = dia.tiempo === reto.tiempo || (dia.tiempo === "triduo" && reto.tiempo === "semana-santa");
  const base = reto.tiempo === "adviento" || reto.tiempo === "cuaresma" ? "morado" : reto.tiempo === "semana-santa" ? "rojo" : reto.tiempo === "ordinario" ? "verde" : "blanco";
  const color = COLOR_HEX[mismo ? dia.color : base];

  return (
    <main id="contenido" className="app-clear">
      <div className="relative h-52 overflow-hidden bg-[#1B1815]">
        {obra ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={obraWebp(obra)} alt="" className="h-full w-full object-cover" />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-[#100E0C] via-[#100E0C]/40 to-transparent" />
        <span className="absolute inset-x-0 top-0 h-1.5" style={{ background: color }} />
        <h1 className="font-display absolute right-4 bottom-4 left-4 text-[clamp(1.7rem,7vw,2.5rem)] leading-tight text-[#F4ECE2]">{reto.titulo[locale]}</h1>
      </div>
      <div className="px-4 pt-4">
        <div className="flex items-center justify-between gap-4">
          <p className="cifra flex items-baseline leading-none whitespace-nowrap">
            <span className="text-6xl">{avance.hechos}</span>
            <span className="text-[1.7rem]">/{avance.total}</span>
          </p>
          <div className="flex flex-col items-center">
            <span className={`inline-flex size-16 items-center justify-center rounded-full border-2 px-1 ${avance.completo ? "bg-[#C9A96E] text-[#100E0C]" : "text-foreground/70"}`} style={{ borderColor: avance.completo ? "#C9A96E" : color }}>
              <span className="font-display text-center text-xs leading-tight">{reto.insignia[locale]}</span>
            </span>
          </div>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-foreground/10">
          <span className="block h-full" style={{ width: `${avance.total ? (avance.hechos / avance.total) * 100 : 0}%`, background: color }} />
        </div>
        <p className="mt-2 text-sm text-muted">{dias} {es ? "días" : "days"}</p>
        <button type="button" className="mt-3 flex min-h-14 w-full items-center justify-center rounded-full bg-acento font-display text-xl text-acento-ink" onClick={() => document.getElementById(`dia-${siguiente}`)?.scrollIntoView({ behavior: "smooth", block: "center" })}>
          {avance.hechos === 0 ? (es ? "Empezar" : "Start") : `${es ? "Seguir" : "Continue"} · ${es ? "Día" : "Day"} ${siguiente}`}
        </button>
        <ul className="mt-5">
          {reto.pasos.map((paso) => {
            const hecho = estado.hechos.includes(paso.dia);
            const mini = portada(paso.obra);
            const ficha = paso.episodio ? library.catalog.episodes.find((episodio) => episodio.id === paso.episodio) : undefined;
            const segundo = ficha ? inicioDelPasaje(ficha.tiempos, paso.capitulo, paso.versiculo, paso.versiculoFin) : null;
            const oir = ficha ? `/ahora?e=${ficha.id}${segundo != null ? `&t=${segundo}` : ""}` : null;
            const cuerpo = (
              <>
                <span className="size-14 shrink-0 overflow-hidden rounded-md bg-[#1B1815]">
                  {mini ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={obraWebp(mini)} alt="" className="h-full w-full object-cover" />
                  ) : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-lg leading-tight">{paso.titulo[locale]}</span>
                  <span className="mt-0.5 block text-sm whitespace-nowrap text-muted">{referenciaPaso(paso, locale, true)} · {paso.minutos} min</span>
                </span>
                {oir ? (
                  <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-[#F4ECE2] text-[#100E0C]" aria-hidden="true">
                    <svg viewBox="0 0 24 24" className="size-5"><path fill="currentColor" d="M8 4.5v15l12-7.5z" /></svg>
                  </span>
                ) : (
                  <span className="inline-flex size-11 shrink-0 items-center justify-center text-muted" aria-label={es ? "Pronto" : "Soon"}>
                    <Candado />
                  </span>
                )}
              </>
            );
            return (
              <li id={`dia-${paso.dia}`} key={paso.dia} className="flex items-center gap-3 border-b border-border py-3">
                {oir ? <Link href={oir} aria-label={paso.titulo[locale]} className="flex min-w-0 flex-1 items-center gap-3">{cuerpo}</Link> : <span className="flex min-w-0 flex-1 items-center gap-3">{cuerpo}</span>}
                <button type="button" aria-label={hecho ? (es ? "Hecho" : "Done") : (es ? "Marcar" : "Mark")} className={`inline-flex size-11 shrink-0 items-center justify-center rounded-full border ${hecho ? "border-transparent text-[#100E0C]" : "border-border"}`} style={hecho ? { background: color } : undefined} onClick={() => marcarDia(reto.id, paso.dia, hoy)}>
                  {hecho ? "✓" : ""}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </main>
  );
}
