"use client";

import { COLOR_HEX, diaLiturgico, textoDiaLiturgico, tramosDelAnio, type TiempoId } from "@audite/domain";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { fechaDeCuando, isoLocal } from "@/lib/cuando";
import { RETOS } from "@/lib/retos";
import { useLibrary } from "@/components/library";

const ORDEN: TiempoId[] = ["adviento", "navidad", "ordinario", "cuaresma", "semana-santa", "pascua"];

export function CalendarioV2() {
  const { settings } = useLibrary();
  const es = settings.uiLocale === "es";
  const cuando = useSearchParams().get("cuando");
  const fecha = useMemo(() => fechaDeCuando(cuando), [cuando]);
  const dia = diaLiturgico(fecha);
  const tramos = tramosDelAnio(dia.iso);
  const total = tramos.reduce((suma, tramo) => suma + (Date.parse(tramo.fin) - Date.parse(tramo.inicio)) / 86400000 + 1, 0);
  const transcurrido = (Date.parse(dia.iso) - Date.parse(tramos[0]?.inicio ?? dia.iso)) / 86400000;
  const marca = Math.min(100, Math.max(0, (transcurrido / total) * 100));
  const nombres = new Map(ORDEN.map((id) => [id, tramos.find((tramo) => tramo.tiempo === id)?.color]));

  return (
    <main id="contenido" className="app-clear px-4 pt-4">
      <h1 className="font-display text-4xl leading-none">{es ? "Calendario" : "Calendar"}</h1>
      <p className="mt-3 font-display text-2xl leading-none">{dia.etiqueta[es ? "es" : "en"]}</p>
      <p className="mt-2 text-sm text-muted">{textoDiaLiturgico(dia, es ? "es" : "en")}</p>
      <div className="relative mt-5 h-8 overflow-hidden rounded-full">
        <div className="flex h-full">
          {tramos.map((tramo) => {
            const dias = (Date.parse(tramo.fin) - Date.parse(tramo.inicio)) / 86400000 + 1;
            return <span key={`${tramo.tiempo}-${tramo.inicio}`} style={{ width: `${(dias / total) * 100}%`, background: COLOR_HEX[tramo.color] }} />;
          })}
        </div>
        <span className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#100E0C] bg-[#C9A96E]" style={{ left: `${marca}%` }} />
      </div>
      <ul className="mt-6">
        {ORDEN.map((id) => {
          const color = nombres.get(id) ?? "verde";
          const retos = RETOS.filter((reto) => reto.tiempo === id || (id === "semana-santa" && reto.tiempo === "semana-santa"));
          const nombre = id === "ordinario" ? (es ? "Tiempo ordinario" : "Ordinary Time") : retos[0]?.titulo[es ? "es" : "en"].split(":")[0] ?? id;
          const etiqueta = id === "adviento" ? (es ? "Adviento" : "Advent") : id === "navidad" ? (es ? "Navidad" : "Christmas") : id === "cuaresma" ? (es ? "Cuaresma" : "Lent") : id === "pascua" ? (es ? "Pascua" : "Easter") : id === "semana-santa" ? (es ? "Semana Santa" : "Holy Week") : nombre;
          return (
            <li key={id} className="border-b border-border">
              <Link href={retos[0] ? `/reto/${retos[0].id}?cuando=${isoLocal(fecha)}` : "/calendario"} className="flex min-h-14 items-center gap-3">
                <span className="h-8 w-1.5 rounded-full" style={{ background: COLOR_HEX[color] }} />
                <span className="font-display text-xl">{etiqueta}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
