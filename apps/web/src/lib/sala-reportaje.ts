import "server-only";
/**
 * Material de reportaje de La sala por obra. SOLO servidor.
 * Los textos viven en `datos/sala-reportaje.json` (es y en). `contextoSala`: público (va en el adelanto, no revela pasos). `reportajePremium`: radios de máscara y comparativa,
 * que solo salen en la respuesta premium de /api/sala/[id]. Sin datos para un id: null (la obra se pinta con valores por defecto).
 */
import datos from "@/datos/sala-reportaje.json";
import type { ComparativaSala, ContextoSala } from "./sala-contexto";

type Bi = { es: string; en: string };
type Ficha = {
  cita: Bi;
  lineaTiempo: Bi[];
  mapa: { id: string; lat: number; lon: number; nombre: Bi; pie: Bi }[];
  /** Radio del foco por paso (fracción del lado menor del visor). */
  radios?: number[];
  comparativa?: { trasPaso: number; entrada: Bi; creditos: Bi; imagenes: { src: string; ancho: number; alto: number; alt: Bi; pie: Bi }[] };
};

/** Contenido por obra (79): cita, línea de tiempo, mapa, radios de máscara y, solo en gn-01, comparativa. */
const FICHAS = datos as Record<string, Ficha>;

const ficha = (id: string): Ficha | null => (Object.prototype.hasOwnProperty.call(FICHAS, id) ? FICHAS[id]! : null);

export function contextoSala(id: string, lang: "es" | "en"): ContextoSala | null {
  const f = ficha(id);
  if (!f) return null;
  return {
    cita: f.cita[lang],
    lineaTiempo: f.lineaTiempo.map((l) => l[lang]),
    mapa: f.mapa.map((p) => ({ id: p.id, lat: p.lat, lon: p.lon, nombre: p.nombre[lang], pie: p.pie[lang] })),
  };
}

/** Solo premium: radios por paso y comparativa. */
export function reportajePremium(id: string, lang: "es" | "en"): { radios: number[]; comparativa: ComparativaSala | null } {
  const f = ficha(id);
  const c = f?.comparativa;
  return {
    radios: f?.radios ?? [],
    comparativa: c ? { trasPaso: c.trasPaso, entrada: c.entrada[lang], creditos: c.creditos[lang], imagenes: c.imagenes.map((i) => ({ src: i.src, ancho: i.ancho, alto: i.alto, alt: i.alt[lang], pie: i.pie[lang] })) } : null,
  };
}
