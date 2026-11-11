"use client";

import { idiomaContenido, COLOR_HEX, diaLiturgico, fraccionReto, inicioDelPasaje, racha, referenciaPaso, type Reto } from "@audite/domain";
import { obraWebp, obrasVisibles } from "@audite/content/obras";
import { portadaDeReto } from "@audite/content/obras-creditos";
import { RETOS } from "@/lib/retos";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useSyncExternalStore } from "react";
import { medir } from "@/lib/medicion";
import { useLibrary } from "@/components/library";
import { fechaDeCuando, isoLocal } from "@/lib/cuando";
import { leerRetos, marcarDia, suscribirRetos } from "@/components/v2/retos-local";

const vacio = leerRetos();

function portada(id: string | null) {
  return obrasVisibles().find((obra) => obra.episodio === id) ?? null;
}

export function RetoV2({ reto, tituloServidor = false }: { reto: Reto; tituloServidor?: boolean }) {
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
  const antesDeAdviento = reto.id === "adviento-isaias" && hoy < "2026-11-29";
  const marcaDia = antesDeAdviento ? (es ? "Empieza el 29 de noviembre" : "Starts 29 November") : `${es ? "Día" : "Day"} ${siguiente}`;
  const propia = portadaDeReto(reto.id);
  const obra = propia ? null : portada(reto.obra) ?? portada(reto.pasos[0]?.obra ?? null);
  const mismo = dia.tiempo === reto.tiempo || (dia.tiempo === "triduo" && reto.tiempo === "semana-santa");
  const base = reto.tiempo === "adviento" || reto.tiempo === "cuaresma" ? "morado" : reto.tiempo === "semana-santa" ? "rojo" : reto.tiempo === "ordinario" ? "verde" : "blanco";
  const color = COLOR_HEX[mismo ? dia.color : base];
  const ui = idiomaContenido(locale);
  const minutos = reto.pasos.reduce((total, paso) => total + paso.minutos, 0);
  const pasoSiguiente = reto.pasos.find((paso) => paso.dia === siguiente) ?? reto.pasos[0];
  const fichaPlay = pasoSiguiente?.episodio ? library.catalog.episodes.find((episodio) => episodio.id === pasoSiguiente.episodio) : undefined;
  const segundoPlay = fichaPlay && pasoSiguiente ? inicioDelPasaje(fichaPlay.tiempos, pasoSiguiente.capitulo, pasoSiguiente.versiculo, pasoSiguiente.versiculoFin) : null;
  const playHref = fichaPlay ? `/ahora?e=${fichaPlay.id}${segundoPlay != null ? `&t=${segundoPlay}` : ""}` : `#dia-${siguiente}`;
  const otros = RETOS.filter((item) => item.id !== reto.id);
  useEffect(() => {
    medir("challenge_started", { reto_id: reto.id });
  }, [reto.id]);

  return (
    <main id="contenido" className="app-clear bg-[#100E0C] text-[#F4ECE2]">
      <section className="relative min-h-[78svh] overflow-hidden bg-[#100E0C]">
        {propia || obra ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={propia ? propia.src.vertical : obraWebp(obra ?? obrasVisibles()[0]!)} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-[#100E0C] via-[#100E0C]/50 to-[#100E0C]/15" />
        <div className="relative z-10 flex min-h-[78svh] flex-col justify-end px-5 pb-8">
          {tituloServidor ? null : <h1 className="font-display max-w-4xl text-5xl leading-[0.92] text-[#F4ECE2] md:text-7xl">{reto.titulo[ui]}</h1>}
          <p className="mt-4 text-base text-[#F4ECE2]">{({ adviento: es ? "Adviento" : "Advent", navidad: es ? "Navidad" : "Christmas", ordinario: es ? "Tiempo ordinario" : "Ordinary Time", cuaresma: es ? "Cuaresma" : "Lent", "semana-santa": es ? "Semana Santa" : "Holy Week", pascua: es ? "Pascua" : "Easter", triduo: es ? "Triduo" : "Triduum" } as Record<string, string>)[reto.tiempo] ?? reto.tiempo} · {marcaDia} · {minutos} min</p>
          <Link href={playHref} className="mt-6 inline-flex size-16 items-center justify-center rounded-full bg-[#C9A96E] text-[#100E0C]" aria-label={es ? "Oír" : "Play"}>
            <svg viewBox="0 0 24 24" className="size-7" aria-hidden="true"><path fill="currentColor" d="M8 4.5v15l12-7.5z" /></svg>
          </Link>
        </div>
      </section>
      <div className="estante flex gap-3 overflow-x-auto px-5 py-6">
        {otros.map((item) => {
          const poster = portadaDeReto(item.id);
          const titulo = (item.tituloCorto ?? item.titulo)[ui];
          return (
            <Link key={item.id} href={`/reto/${item.id}`} className="w-36 shrink-0 snap-start">
              {poster ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={poster.src.cuadrado} alt="" className="aspect-square w-full object-cover" />
              ) : <span className="block aspect-square bg-[#1B1815]" />}
              <span className="mt-2 block font-display text-sm leading-tight">{titulo}</span>
            </Link>
          );
        })}
      </div>
      <div className="px-4 pt-2">
        <div className="flex items-center justify-between gap-4">
          <p className="cifra flex items-baseline leading-none whitespace-nowrap">
            <span className="text-6xl">{avance.hechos}</span>
            <span className="text-[1.7rem]">/{avance.total}</span>
          </p>
          <div className="flex flex-col items-center">
            <span className={`inline-flex size-16 items-center justify-center rounded-full border-2 px-1 ${avance.completo ? "bg-[#C9A96E] text-[#100E0C]" : "text-foreground/70"}`} style={{ borderColor: avance.completo ? "#C9A96E" : color }}>
              <span className="font-display text-center text-xs leading-tight">{reto.insignia[idiomaContenido(locale)]}</span>
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
                  <span className="block font-display text-lg leading-tight">{paso.titulo[idiomaContenido(locale)]}</span>
                  <span className="mt-0.5 block text-sm whitespace-nowrap text-muted">{referenciaPaso(paso, locale, true)} · {paso.minutos} min</span>
                </span>
                {oir ? (
                  <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-[#F4ECE2] text-[#100E0C]" aria-hidden="true">
                    <svg viewBox="0 0 24 24" className="size-5"><path fill="currentColor" d="M8 4.5v15l12-7.5z" /></svg>
                  </span>
                ) : (
                  <span className="shrink-0 text-xs text-muted">{es ? "Pronto" : "Soon"}</span>
                )}
              </>
            );
            return (
              <li id={`dia-${paso.dia}`} key={paso.dia} className="flex items-center gap-3 border-b border-border py-3">
                {oir ? <Link href={oir} aria-label={paso.titulo[idiomaContenido(locale)]} className="flex min-w-0 flex-1 items-center gap-3">{cuerpo}</Link> : <span className="flex min-w-0 flex-1 items-center gap-3">{cuerpo}</span>}
                <button type="button" aria-label={hecho ? (es ? "Hecho" : "Done") : (es ? "Marcar" : "Mark")} className={`inline-flex size-11 shrink-0 items-center justify-center rounded-full border ${hecho ? "border-transparent text-[#100E0C]" : "border-border"}`} style={hecho ? { background: color } : undefined} onClick={() => {
                  const estaba = estado.hechos.includes(paso.dia);
                  marcarDia(reto.id, paso.dia, hoy);
                  if (estaba) return;
                  medir("challenge_day_completed", { reto_id: reto.id, dia: paso.dia, episode_id: paso.episodio ?? "" });
                  if (estado.hechos.length + 1 >= reto.pasos.length) medir("challenge_completed", { reto_id: reto.id });
                }}>
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
