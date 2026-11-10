"use client";

import { idiomaContenido, COLOR_HEX, diaLiturgico, textoDiaLiturgico, tramosDelAnio, type TiempoId, type TramoLiturgico } from "@audite/domain";
import { obraWebp, obrasVisibles } from "@audite/content/obras";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { fechaDeCuando } from "@/lib/cuando";
import { RETOS } from "@/lib/retos";
import { useLibrary } from "@/components/library";

const NOMBRES: Record<TiempoId, { es: string; en: string }> = {
  adviento: { es: "Adviento", en: "Advent" },
  navidad: { es: "Navidad", en: "Christmas" },
  ordinario: { es: "Tiempo ordinario", en: "Ordinary Time" },
  cuaresma: { es: "Cuaresma", en: "Lent" },
  "semana-santa": { es: "Semana Santa", en: "Holy Week" },
  triduo: { es: "Triduo", en: "Triduum" },
  pascua: { es: "Pascua", en: "Easter" },
};

const MESES = {
  es: ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"],
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
};

function corta(valor: string, locale: string): string {
  const [, mes, dia] = valor.split("-").map(Number);
  return `${dia} ${MESES[idiomaContenido(locale)][(mes ?? 1) - 1]}`;
}

function dias(desde: string, hasta: string): number {
  return Math.round((Date.parse(hasta) - Date.parse(desde)) / 86400000) + 1;
}

function punto(angulo: number, radio: number): { x: number; y: number } {
  const rad = ((angulo - 90) * Math.PI) / 180;
  return { x: 100 + Math.cos(rad) * radio, y: 100 + Math.sin(rad) * radio };
}

function arco(desde: number, hasta: number, radio: number): string {
  const a = punto(desde, radio);
  const b = punto(hasta, radio);
  const grande = hasta - desde > 180 ? 1 : 0;
  return `M ${a.x} ${a.y} A ${radio} ${radio} 0 ${grande} 1 ${b.x} ${b.y}`;
}

export function CalendarioV2() {
  const { settings } = useLibrary();
  const locale = settings.uiLocale;
  const es = locale === "es";
  const cuando = useSearchParams().get("cuando");
  const fecha = useMemo(() => fechaDeCuando(cuando), [cuando]);
  const dia = diaLiturgico(fecha);
  const tramos = tramosDelAnio(dia.iso);
  const total = tramos.reduce((suma, tramo) => suma + dias(tramo.inicio, tramo.fin), 0);
  const anillos = tramos.reduce<{ cursor: number; arcos: { tramo: TramoLiturgico; d: string }[] }>((estado, tramo) => {
    const largo = dias(tramo.inicio, tramo.fin);
    const desde = (estado.cursor / total) * 360 + 0.8;
    const siguiente = estado.cursor + largo;
    const hasta = (siguiente / total) * 360 - 0.8;
    return { cursor: siguiente, arcos: [...estado.arcos, { tramo, d: arco(desde, Math.max(desde + 0.4, hasta), 62) }] };
  }, { cursor: 0, arcos: [] }).arcos;
  const anguloHoy = ((dias(tramos[0]?.inicio ?? dia.iso, dia.iso) - 0.5) / total) * 360;
  const marcaDentro = punto(anguloHoy, 76);
  const marca = punto(anguloHoy, 90);
  const usadas = new Set<string>();
  function tomar(preferida: string | null): string | null {
    if (preferida && !usadas.has(preferida)) {
      usadas.add(preferida);
      return preferida;
    }
    const libre = obrasVisibles().find((obra) => !usadas.has(obra.episodio));
    if (!libre) return preferida;
    usadas.add(libre.episodio);
    return libre.episodio;
  }

  return (
    <main id="contenido" className="app-clear px-4 pt-4">
      <h1 className="font-display text-4xl leading-none">{es ? "Calendario" : "Calendar"}</h1>
      <p className="mt-3 font-display text-2xl leading-none">{dia.etiqueta[idiomaContenido(locale)]}</p>
      <p className="mt-2 text-sm text-muted">{textoDiaLiturgico(dia, locale)}</p>
      <div className="mx-auto mt-2 w-[min(100%,14.5rem)]">
        <svg viewBox="0 0 200 200" className="h-auto w-full" role="img" aria-label={dia.etiqueta[idiomaContenido(locale)]}>
          <circle cx="100" cy="100" r="62" fill="none" stroke="currentColor" strokeOpacity="0.08" strokeWidth="18" />
          {anillos.map((anillo) => (
            <path key={`${anillo.tramo.tiempo}-${anillo.tramo.inicio}`} d={anillo.d} fill="none" stroke={COLOR_HEX[anillo.tramo.color]} strokeWidth="18" />
          ))}
          <line x1={marcaDentro.x} y1={marcaDentro.y} x2={marca.x} y2={marca.y} stroke="#C9A96E" strokeWidth="2" />
          <circle cx={marca.x} cy={marca.y} r="4.5" fill="#C9A96E" />
        </svg>
      </div>
      <ul className="mt-2 space-y-3">
        {tramos.map((tramo) => (
          <TarjetaTiempo key={`${tramo.tiempo}-${tramo.inicio}`} tramo={tramo} hoy={dia.iso} locale={locale} obra={tomar(RETOS.find((reto) => reto.tiempo === tramo.tiempo)?.obra ?? null)} />
        ))}
      </ul>
    </main>
  );
}

function TarjetaTiempo({ tramo, hoy, locale, obra }: { tramo: TramoLiturgico; hoy: string; locale: string; obra: string | null }) {
  const es = locale === "es";
  const reto = RETOS.find((item) => item.tiempo === tramo.tiempo);
  const portada = obrasVisibles().find((item) => item.episodio === obra);
  const dentro = hoy >= tramo.inicio && hoy <= tramo.fin;
  const quedan = dentro ? dias(hoy, tramo.fin) : null;
  return (
    <li>
      <Link href={reto ? `/reto/${reto.id}?cuando=${hoy}` : "/calendario"} className="flex overflow-hidden rounded-2xl bg-card">
        <span className="relative w-24 shrink-0 self-stretch bg-[#1B1815]">
          {portada ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={obraWebp(portada)} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : null}
          <span className="absolute inset-y-0 left-0 w-1.5" style={{ background: COLOR_HEX[tramo.color] }} />
        </span>
        <span className="flex min-w-0 flex-1 flex-col justify-center px-3 py-3">
          <span className="font-display text-xl leading-none">{NOMBRES[tramo.tiempo][idiomaContenido(locale)]}</span>
          <span className="mt-1 text-sm whitespace-nowrap">{corta(tramo.inicio, locale)} – {corta(tramo.fin, locale)}</span>
          <span className="text-sm leading-snug">{quedan == null ? "" : `${quedan} ${es ? "días" : "days"} · `}{reto?.titulo[idiomaContenido(locale)]}</span>
        </span>
      </Link>
    </li>
  );
}
