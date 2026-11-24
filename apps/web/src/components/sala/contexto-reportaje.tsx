import { CAJA_MAPA, LAGO, partirLinea, proyectar, SILUETA, trazado, type ContextoSala, type PuntoMapa } from "@/lib/sala-contexto";

const ROTULOS = {
  es: { mapa: "Dónde estuvo", tiempo: "Su historia", mapaDe: "Mapa con" },
  en: { mapa: "Where it has been", tiempo: "Its history", mapaDe: "Map with" },
};

/** Cita grande tomada de la apertura. */
export function CitaGrande({ texto }: { texto: string }) {
  return (
    <blockquote data-cita className="my-2 border-l-2 border-[#C9A96E] pl-5 font-display text-[1.75rem] leading-[1.2] text-[#F4ECE2] md:text-4xl">
      {texto}
    </blockquote>
  );
}

/** Mapa SVG propio (sin teselas ni servicios): silueta sencilla de los Países Bajos y su entorno, con los puntos numerados. */
export function MapaSala({ puntos, lang }: { puntos: PuntoMapa[]; lang: "es" | "en" }) {
  const r = ROTULOS[lang];
  const pos = puntos.map((p) => proyectar(p.lat, p.lon));
  return (
    <section data-mapa className="grid gap-4 md:gap-5">
      <h2 className="font-display text-xl">{r.mapa}</h2>
      <svg viewBox={`0 0 ${CAJA_MAPA.w} ${CAJA_MAPA.h}`} role="img" aria-label={`${r.mapaDe} ${puntos.map((p) => p.nombre).join(", ")}`} className="mx-auto h-auto w-full max-w-[17rem] rounded-2xl md:max-w-[22rem] bg-[#100E0C]">
        <path d={trazado(SILUETA)} fill="#1B1815" stroke="#3A3328" strokeWidth="1.2" strokeLinejoin="round" />
        <path d={trazado(LAGO)} fill="#100E0C" stroke="#3A3328" strokeWidth="0.8" />
        <polyline points={pos.map((q) => `${q.x.toFixed(1)},${q.y.toFixed(1)}`).join(" ")} fill="none" stroke="#C9A96E" strokeOpacity="0.55" strokeWidth="1.2" strokeDasharray="3 3" />
        {puntos.map((p, i) => {
          const q = pos[i]!;
          const izquierda = q.x < 135;
          return (
            <g key={p.id} data-punto={p.id}>
              <circle cx={q.x} cy={q.y} r="6" fill="#C9A96E" />
              <text x={q.x} y={q.y + 3.5} textAnchor="middle" fontSize="9" fontWeight="700" fill="#100E0C">{i + 1}</text>
              <text x={q.x + (izquierda ? -10 : 10)} y={q.y + 4} textAnchor={izquierda ? "end" : "start"} fontSize="11" fill="#E7D7C3">{p.nombre}</text>
            </g>
          );
        })}
      </svg>
      <ol className="grid gap-2 text-base leading-snug text-[#F4ECE2]/90">
        {puntos.map((p, i) => (
          <li key={p.id} className="flex gap-3">
            <span aria-hidden="true" className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-[#C9A96E] text-xs font-bold text-[#100E0C]">{i + 1}</span>
            <span>{p.pie}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** Línea de tiempo vertical: cada línea del JSON empieza por su fecha. */
export function LineaTiempo({ lineas, lang }: { lineas: string[]; lang: "es" | "en" }) {
  return (
    <section data-linea-tiempo className="grid gap-4">
      <h2 className="font-display text-xl">{ROTULOS[lang].tiempo}</h2>
      <ol className="relative grid gap-5 border-l border-[#3A3328] pl-6">
        {lineas.map((l) => {
          const { anio, resto } = partirLinea(l);
          return (
            <li key={l} className="relative">
              <span aria-hidden="true" className="absolute top-2 -left-[1.9rem] size-2.5 rounded-full bg-[#C9A96E]" />
              {anio ? <p className="font-display text-2xl text-[#C9A96E]">{anio}</p> : null}
              <p className="text-base leading-snug text-[#F4ECE2]/90">{resto}</p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/** Contexto de la apertura: cita, mapa y línea de tiempo. Lo que falta no se pinta. Nada de esto revela pasos posteriores. */
export function ContextoReportaje({ contexto, lang, conCita = true }: { contexto?: ContextoSala | null; lang: "es" | "en"; conCita?: boolean }) {
  if (!contexto) return null;
  const { cita, mapa, lineaTiempo } = contexto;
  const hayMapa = !!mapa?.length;
  const hayTiempo = !!lineaTiempo?.length;
  if (!(conCita && cita) && !hayMapa && !hayTiempo) return null;
  return (
    <div data-contexto className="grid gap-10 py-6 md:gap-14 md:py-10">
      {conCita && cita ? <CitaGrande texto={cita} /> : null}
      {hayMapa ? <MapaSala puntos={mapa!} lang={lang} /> : null}
      {hayTiempo ? <LineaTiempo lineas={lineaTiempo!} lang={lang} /> : null}
    </div>
  );
}
