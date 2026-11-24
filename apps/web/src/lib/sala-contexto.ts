/**
 * Datos de reportaje de La sala (seguros para el cliente): tipos y utilidades puras.
 * El contenido por obra vive en `sala-reportaje.ts` (solo servidor). Nada de pasos ni cierre aquí.
 */

export type PuntoMapa = { id: string; lat: number; lon: number; nombre: string; pie: string };
/** Contexto de la apertura: público, no revela pasos posteriores. Todo opcional: lo que falta no se pinta. */
export type ContextoSala = { cita?: string; lineaTiempo?: string[]; mapa?: PuntoMapa[] };

export type ImagenComparativa = { src: string; ancho: number; alto: number; alt: string; pie: string };
/** Comparativa de imágenes ajenas a la obra. Solo viaja en el relato premium. `trasPaso`: se coloca tras ese paso (1..n). */
export type ComparativaSala = { trasPaso: number; entrada: string; imagenes: ImagenComparativa[]; creditos: string };

export function contextoVacio(c: ContextoSala | null | undefined): boolean {
  return !c || (!c.cita && !c.lineaTiempo?.length && !c.mapa?.length);
}

/** «1535. Texto…» → { anio: "1535", resto: "Texto…" }. Separa en el primer «. » (hasta 24 caracteres: admite «Between 1754 and 1756»). */
export function partirLinea(linea: string): { anio: string; resto: string } {
  const i = linea.indexOf(". ");
  return i > 0 && i <= 24 ? { anio: linea.slice(0, i), resto: linea.slice(i + 2) } : { anio: "", resto: linea };
}

/** Marco del mapa de los Países Bajos y su entorno (grados). Es el marco por defecto cuando todos los puntos caen dentro. */
export const MARCO_MAPA = { lonMin: 2.4, lonMax: 7.4, latMin: 50.4, latMax: 53.6 } as const;
const COS_LAT = Math.cos((52 * Math.PI) / 180);
export const CAJA_MAPA = { w: Math.round((MARCO_MAPA.lonMax - MARCO_MAPA.lonMin) * COS_LAT * 100), h: Math.round((MARCO_MAPA.latMax - MARCO_MAPA.latMin) * 100) } as const;

/** Proyección equirrectangular corregida por la latitud, a la caja del SVG (marco de los Países Bajos). */
export function proyectar(lat: number, lon: number): { x: number; y: number } {
  return { x: (lon - MARCO_MAPA.lonMin) * COS_LAT * 100, y: (MARCO_MAPA.latMax - lat) * 100 };
}

/** Silueta muy simplificada de la costa y las fronteras de Países Bajos y Bélgica (lon, lat). */
export const SILUETA: readonly (readonly [number, number])[] = [
  [2.55, 51.08], [2.92, 51.23], [3.2, 51.33], [3.55, 51.4], [3.5, 51.58], [3.9, 51.75], [4.1, 51.98], [4.25, 52.1], [4.53, 52.37],
  [4.6, 52.47], [4.62, 52.6], [4.75, 52.96], [5.1, 53.0], [5.6, 53.3], [6.2, 53.45], [7.0, 53.3], [7.2, 52.6], [6.9, 52.2],
  [6.8, 51.95], [6.1, 51.85], [6.0, 51.4], [6.2, 51.2], [5.9, 50.8], [6.0, 50.75], [6.2, 50.5], [5.5, 50.4], [4.2, 50.4],
  [3.6, 50.4], [2.9, 50.75],
];
/** Mar interior (IJsselmeer) para que la silueta se reconozca. */
export const LAGO: readonly (readonly [number, number])[] = [[5.05, 52.95], [5.45, 52.78], [5.7, 52.6], [5.55, 52.45], [5.15, 52.45], [5.0, 52.62], [5.1, 52.8]];

export function trazado(puntos: readonly (readonly [number, number])[]): string {
  return puntos.map(([lon, lat], i) => {
    const { x, y } = proyectar(lat, lon);
    return `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join("") + "Z";
}

/* ───────── Marco autoajustado por obra ───────── */

export type MarcoMapa = { lonMin: number; lonMax: number; latMin: number; latMax: number };
type PuntoGeo = { lat: number; lon: number };

/** Margen alrededor de los puntos (fracción de su extensión por cada lado) y extensión mínima (grados de latitud) para que una sola ciudad se vea en su región. */
const MARGEN = 0.3;
const SPAN_MIN = 7;
/** Proporción ancho/alto permitida de la caja. */
const ASPECTO_MIN = 0.8;
const ASPECTO_MAX = 1.5;
const ANCHO_BASE = 310;

const cosDe = (latCentro: number) => Math.cos((latCentro * Math.PI) / 180);
const dentroDe = (m: MarcoMapa, p: PuntoGeo) => p.lon > m.lonMin && p.lon < m.lonMax && p.lat > m.latMin && p.lat < m.latMax;

/**
 * Marco del mapa de una obra a partir de sus puntos. Si todos caen en el recuadro neerlandés se usa ese (detalle con IJsselmeer).
 * En otro caso: caja de los puntos con margen, extensión mínima y proporción acotada, centrada en los puntos.
 */
export function marcoDe(puntos: readonly PuntoGeo[]): MarcoMapa {
  if (!puntos.length) return { ...MARCO_MAPA };
  if (puntos.every((p) => dentroDe(MARCO_MAPA, p))) return { ...MARCO_MAPA };
  const lats = puntos.map((p) => p.lat);
  const lons = puntos.map((p) => p.lon);
  const latC = (Math.min(...lats) + Math.max(...lats)) / 2;
  const lonC = (Math.min(...lons) + Math.max(...lons)) / 2;
  const c = cosDe(latC);
  let alto = Math.max((Math.max(...lats) - Math.min(...lats)) * (1 + 2 * MARGEN), SPAN_MIN);
  let ancho = Math.max((Math.max(...lons) - Math.min(...lons)) * c * (1 + 2 * MARGEN), SPAN_MIN);
  if (ancho / alto < ASPECTO_MIN) ancho = alto * ASPECTO_MIN;
  if (ancho / alto > ASPECTO_MAX) alto = ancho / ASPECTO_MAX;
  return { lonMin: lonC - ancho / c / 2, lonMax: lonC + ancho / c / 2, latMin: latC - alto / 2, latMax: latC + alto / 2 };
}

export const esMarcoNeerlandes = (m: MarcoMapa) => m.lonMin === MARCO_MAPA.lonMin && m.lonMax === MARCO_MAPA.lonMax && m.latMin === MARCO_MAPA.latMin && m.latMax === MARCO_MAPA.latMax;
const geometria = (m: MarcoMapa) => {
  const cos = cosDe((m.latMin + m.latMax) / 2);
  const ancho = (m.lonMax - m.lonMin) * cos;
  const escala = esMarcoNeerlandes(m) ? 100 : ANCHO_BASE / ancho;
  return { cos, escala, w: Math.round(ancho * escala), h: Math.round((m.latMax - m.latMin) * escala) };
};

/** Caja (unidades del SVG) de un marco. */
export function cajaDe(m: MarcoMapa): { w: number; h: number } {
  const { w, h } = geometria(m);
  return { w, h };
}

/** Proyección equirrectangular corregida por la latitud, relativa al marco. */
export function proyectarEn(m: MarcoMapa, lat: number, lon: number): { x: number; y: number } {
  const { cos, escala } = geometria(m);
  return { x: (lon - m.lonMin) * cos * escala, y: (m.latMax - lat) * escala };
}

/** Trazado SVG (cerrado) de un polígono lon/lat proyectado en el marco. */
export function trazadoEn(m: MarcoMapa, poligono: readonly (readonly [number, number])[]): string {
  return poligono.map(([lon, lat], i) => {
    const { x, y } = proyectarEn(m, lat, lon);
    return `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join("") + "Z";
}
