import { cajaDe, esMarcoNeerlandes, LAGO, marcoDe, partirLinea, proyectarEn, SILUETA, trazado, trazadoEn, type ContextoSala, type PuntoMapa } from "@/lib/sala-contexto";
import { siluetaEuropa } from "@/lib/sala-mapa-europa";

/**
 * Móvil, relato premium: la sección se pinta POR ENCIMA del visor sticky (z-25 > z-20) y POR DEBAJO de la cabecera (.cabecera es z-30). La columna de texto no crea contexto de apilamiento,
 * a ancho completo (sale del padding lateral de la columna (px-5 / px-6)), fondo opaco y alto de pantalla bajo la cabecera. En md no cambia nada.
 */
export const PANTALLA_MOVIL = "max-md:relative max-md:z-[25] max-md:-mx-5 min-[480px]:max-md:-mx-6 max-md:min-h-[calc(100svh-var(--cab,76px))] max-md:content-center max-md:bg-[#0C0B09] max-md:px-5 min-[480px]:max-md:px-6 max-md:py-6";

const ROTULOS = {
  es: { mapa: "Dónde estuvo", tiempo: "Su historia", mapaDe: "Mapa con" },
  en: { mapa: "Where it has been", tiempo: "Its history", mapaDe: "Map with" },
};

/** Cita grande tomada de la apertura. */
export function CitaGrande({ texto }: { texto: string }) {
  return (
    <blockquote data-cita className="my-2 border-l-2 border-[#C9A96E] pl-5 font-display text-[1.75rem] leading-[1.35] text-[#F4ECE2] md:text-4xl md:leading-[1.2]">
      {texto}
    </blockquote>
  );
}

/** Ancho aproximado de un rótulo del mapa (unidades del SVG, cuerpo 11). */
const anchoRotulo = (t: string) => t.length * 5.8;

/**
 * Mapa SVG propio (sin teselas ni servicios): el marco se ajusta a los puntos de la obra y la silueta de Europa, el Mediterráneo y el Levante
 * se recorta a ese marco. Si el marco es el neerlandés se pinta el detalle de los Países Bajos con el IJsselmeer.
 * La silueta es solo apoyo: los puntos y sus rótulos se pintan siempre, caigan o no dentro de ella.
 */
export function MapaSala({ puntos, lang, pantalla = false }: { puntos: PuntoMapa[]; lang: "es" | "en"; pantalla?: boolean }) {
  const r = ROTULOS[lang];
  const marco = marcoDe(puntos);
  const caja = cajaDe(marco);
  const neerlandes = esMarcoNeerlandes(marco);
  const silueta = neerlandes ? null : siluetaEuropa(marco);
  const pos = puntos.map((p) => proyectarEn(marco, p.lat, p.lon));
  return (
    <section data-mapa {...(pantalla ? { "data-pantalla": "" } : {})} className={`grid gap-4 md:gap-5 ${pantalla ? PANTALLA_MOVIL : ""}`}>
      <h2 className="font-display text-xl">{r.mapa}</h2>
      <svg viewBox={`0 0 ${caja.w} ${caja.h}`} role="img" aria-label={`${r.mapaDe} ${puntos.map((p) => p.nombre).join(", ")}`} className="mx-auto h-auto w-full rounded-2xl md:max-w-[22rem] bg-[#100E0C]">
        {neerlandes ? (
          <>
            <path d={trazado(SILUETA)} fill="#1B1815" stroke="#3A3328" strokeWidth="1.2" strokeLinejoin="round" />
            <path d={trazado(LAGO)} fill="#100E0C" stroke="#3A3328" strokeWidth="0.8" />
          </>
        ) : (
          <g fill="#1B1815" stroke="#3A3328" strokeWidth="1.2" strokeLinejoin="round">
            {silueta!.tierra.map((poligono, i) => (
              <path key={i} d={trazadoEn(marco, poligono) + (i === 0 ? silueta!.mares.map((m) => trazadoEn(marco, m)).join("") : "")} fillRule="evenodd" />
            ))}
          </g>
        )}
        <polyline points={pos.map((q) => `${q.x.toFixed(1)},${q.y.toFixed(1)}`).join(" ")} fill="none" stroke="#C9A96E" strokeOpacity="0.55" strokeWidth="1.2" strokeDasharray="3 3" />
        {puntos.map((p, i) => {
          const q = pos[i]!;
          const ancho = anchoRotulo(p.nombre);
          const cabeIzq = q.x - 10 - ancho >= 0;
          const cabeDer = q.x + 10 + ancho <= caja.w;
          // Los puntos de la mitad izquierda de la caja rotulan hacia fuera (a la izquierda), los de la derecha a la derecha; si no cabe, al otro lado.
          const izquierda = q.x < caja.w / 2 ? cabeIzq || !cabeDer : !cabeDer && cabeIzq;
          return (
            <g key={p.id} data-punto={p.id}>
              <circle cx={q.x} cy={q.y} r="6" fill="#C9A96E" />
              <text x={q.x} y={q.y + 3.5} textAnchor="middle" fontSize="9" fontWeight="700" fill="#100E0C">{i + 1}</text>
              <text x={q.x + (izquierda ? -10 : 10)} y={q.y + 4} textAnchor={izquierda ? "end" : "start"} fontSize="11" fill="#E7D7C3">{p.nombre}</text>
            </g>
          );
        })}
      </svg>
      <ol className="grid gap-3 text-[1.0625rem] leading-[1.55] text-[#F4ECE2] md:gap-2 md:text-base md:leading-snug md:text-[#F4ECE2]/90">
        {puntos.map((p, i) => (
          <li key={p.id} className="flex gap-3">
            <span aria-hidden="true" className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-[#C9A96E] text-sm font-bold text-[#100E0C] md:text-xs">{i + 1}</span>
            <span>{p.pie}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** Línea de tiempo vertical: cada línea del JSON empieza por su fecha. */
export function LineaTiempo({ lineas, lang, pantalla = false }: { lineas: string[]; lang: "es" | "en"; pantalla?: boolean }) {
  return (
    <section data-linea-tiempo {...(pantalla ? { "data-pantalla": "" } : {})} className={`grid gap-4 ${pantalla ? PANTALLA_MOVIL : ""}`}>
      <h2 className="font-display text-xl">{ROTULOS[lang].tiempo}</h2>
      <ol className="relative grid gap-5 border-l border-[#3A3328] pl-6">
        {lineas.map((l) => {
          const { anio, resto } = partirLinea(l);
          return (
            <li key={l} className="relative">
              <span aria-hidden="true" className="absolute top-2 -left-[1.9rem] size-2.5 rounded-full bg-[#C9A96E]" />
              {anio ? <p className="font-display text-2xl text-[#C9A96E]">{anio}</p> : null}
              <p className="text-[1.0625rem] leading-[1.55] text-[#F4ECE2] md:text-base md:leading-snug md:text-[#F4ECE2]/90">{resto}</p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/** Contexto de la apertura: cita, mapa y línea de tiempo. Lo que falta no se pinta. Nada de esto revela pasos posteriores. */
export function ContextoReportaje({ contexto, lang, conCita = true, pantalla = false }: { contexto?: ContextoSala | null; lang: "es" | "en"; conCita?: boolean; pantalla?: boolean }) {
  if (!contexto) return null;
  const { cita, mapa, lineaTiempo } = contexto;
  const hayMapa = !!mapa?.length;
  const hayTiempo = !!lineaTiempo?.length;
  if (!(conCita && cita) && !hayMapa && !hayTiempo) return null;
  return (
    <div data-contexto className={`grid gap-10 py-6 max-md:gap-0 md:gap-14 md:py-10${pantalla ? " max-md:mb-[62svh]" : ""}`}>
      {conCita && cita ? <CitaGrande texto={cita} /> : null}
      {hayMapa ? <MapaSala puntos={mapa!} lang={lang} pantalla={pantalla} /> : null}
      {hayTiempo ? <LineaTiempo lineas={lineaTiempo!} lang={lang} pantalla={pantalla} /> : null}
    </div>
  );
}
