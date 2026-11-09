"use client";

import { COLOR_HEX, diaLiturgico, fraccionReto, racha, type Reto } from "@audite/domain";
import { obraDeEpisodio, obraWebp } from "@audite/content/obras";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useSyncExternalStore } from "react";
import { useLibrary } from "@/components/library";
import { fechaDeCuando, isoLocal } from "@/lib/cuando";
import { leerRetos, marcarDia, suscribirRetos } from "@/components/v2/retos-local";

const vacio = leerRetos();

export function RetoV2({ reto }: { reto: Reto }) {
  const { settings } = useLibrary();
  const es = settings.uiLocale === "es";
  const cuando = useSearchParams().get("cuando");
  const fecha = useMemo(() => fechaDeCuando(cuando), [cuando]);
  const hoy = isoLocal(fecha);
  const dia = diaLiturgico(fecha);
  const guardado = useSyncExternalStore(suscribirRetos, leerRetos, () => vacio);
  const estado = guardado[reto.id] ?? { hechos: [], fechas: [] };
  const avance = fraccionReto(estado.hechos, reto.pasos.length);
  const dias = racha(estado.fechas, hoy);
  const portada = reto.pasos.find((paso) => paso.obra && obraDeEpisodio(paso.obra))?.obra ?? reto.pasos[0]?.obra ?? null;
  const obra = portada ? obraDeEpisodio(portada) : null;
  const color = COLOR_HEX[dia.tiempo === reto.tiempo ? dia.color : "verde"];

  return (
    <main id="contenido" className="app-clear">
      <div className="relative h-56 overflow-hidden bg-[#1B1815]">
        {obra ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={obraWebp(obra)} alt="" className="h-full w-full object-cover" />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        <span className="absolute inset-x-0 top-0 h-1.5" style={{ background: color }} />
        <h1 className="font-display absolute right-4 bottom-4 left-4 text-[clamp(1.6rem,7vw,2.4rem)] leading-none">{reto.titulo[es ? "es" : "en"]}</h1>
      </div>
      <div className="px-4 pt-4">
        <div className="flex items-end justify-between gap-3">
          <p className="font-display text-4xl leading-none">{avance.hechos}<span className="text-xl text-muted">/{avance.total}</span></p>
          <p className="text-sm">{dias} {es ? "días" : "days"}</p>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-foreground/10">
          <span className="block h-full" style={{ width: `${avance.total ? (avance.hechos / avance.total) * 100 : 0}%`, background: color }} />
        </div>
        {avance.completo ? (
          <div className="mt-4 flex items-center gap-3">
            <span className="inline-flex size-14 items-center justify-center rounded-full border-2" style={{ borderColor: color }}>
              <span className="size-8 rounded-full" style={{ background: color }} />
            </span>
            <span className="font-display text-2xl">{reto.titulo[es ? "es" : "en"]}</span>
          </div>
        ) : null}
        <ul className="mt-4">
          {reto.pasos.map((paso) => {
            const hecho = estado.hechos.includes(paso.dia);
            return (
              <li key={paso.dia} className="flex min-h-14 items-center justify-between gap-3 border-b border-border">
                <span className="min-w-0">
                  <span className="mr-3 text-sm text-muted">{paso.dia}</span>
                  <Link href={`/libro/${paso.libroId}`} className="font-display text-xl whitespace-nowrap">{paso.cita}</Link>
                </span>
                <button type="button" aria-label={paso.cita} className={`inline-flex size-11 shrink-0 items-center justify-center rounded-full border ${hecho ? "border-transparent text-[#100E0C]" : "border-border"}`} style={hecho ? { background: color } : undefined} onClick={() => marcarDia(reto.id, paso.dia, hoy)}>
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
