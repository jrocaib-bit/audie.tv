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

/** «1535. Texto…» → { anio: "1535", resto: "Texto…" }. Separa en el primer «. ». */
export function partirLinea(linea: string): { anio: string; resto: string } {
  const i = linea.indexOf(". ");
  return i > 0 && i <= 20 ? { anio: linea.slice(0, i), resto: linea.slice(i + 2) } : { anio: "", resto: linea };
}

/** Marco del mapa de los Países Bajos y su entorno (grados). */
export const MARCO_MAPA = { lonMin: 2.4, lonMax: 7.4, latMin: 50.4, latMax: 53.6 } as const;
const COS_LAT = Math.cos((52 * Math.PI) / 180);
export const CAJA_MAPA = { w: Math.round((MARCO_MAPA.lonMax - MARCO_MAPA.lonMin) * COS_LAT * 100), h: Math.round((MARCO_MAPA.latMax - MARCO_MAPA.latMin) * 100) } as const;

/** Proyección equirrectangular corregida por la latitud, a la caja del SVG. */
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
