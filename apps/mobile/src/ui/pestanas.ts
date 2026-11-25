import type { NombreIcono } from "./Icono";

/** Claves de texto que usan la barra y los segmentados. Todas existen en `textos.ts` en es y en. */
type ClaveTexto = "tabHoy" | "tabBiblia" | "tabRetos" | "tabSala" | "tabBiblioteca" | "tabCaminos" | "tabLibros";

export type Segmento = { href: string; etiqueta: ClaveTexto };
export type Pestana = { href: string; icono: NombreIcono; etiqueta: ClaveTexto; segmentos?: readonly Segmento[] };

/** Segmentos de la pestaña Biblia. El primero es el que abre por defecto. */
export const SEGMENTOS_BIBLIA: readonly Segmento[] = [
  { href: "/escuchar", etiqueta: "tabBiblioteca" },
  { href: "/escuchar/caminos", etiqueta: "tabCaminos" },
];

/** Segmentos de la pestaña La sala. El primero es el que abre por defecto. */
export const SEGMENTOS_SALA: readonly Segmento[] = [
  { href: "/sala", etiqueta: "tabSala" },
  { href: "/sala/libros", etiqueta: "tabLibros" },
];

/** Las cuatro pestañas de la barra, en su orden. */
export const PESTANAS: readonly Pestana[] = [
  { href: "/", icono: "hoy", etiqueta: "tabHoy" },
  { href: "/escuchar", icono: "biblioteca", etiqueta: "tabBiblia", segmentos: SEGMENTOS_BIBLIA },
  { href: "/retos", icono: "retos", etiqueta: "tabRetos" },
  { href: "/sala", icono: "sala", etiqueta: "tabSala", segmentos: SEGMENTOS_SALA },
];

/** Rutas viejas que llevan a su sitio nuevo. `/libros` es solo la estantería: las fichas y el lector siguen igual. */
export const REDIRECCIONES = {
  "/biblioteca": "/escuchar",
  "/catalogo": "/escuchar",
  "/camino": "/escuchar/caminos",
  "/caminos": "/escuchar/caminos",
  "/libros": "/sala/libros",
} as const;

/** Rutas donde se ve la barra: las de cada pestaña y segmento, y Ajustes. */
export const RUTAS_PESTANAS: readonly string[] = [...PESTANAS.flatMap((p) => (p.segmentos ? p.segmentos.map((s) => s.href) : [p.href])), "/ajustes"];

/** Pestaña que se resalta para una ruta. Las rutas de un segmento resaltan su pestaña. */
export function pestanaActiva(path: string): string | null {
  for (const p of PESTANAS) {
    const rutas = p.segmentos ? p.segmentos.map((s) => s.href) : [p.href];
    if (rutas.includes(path)) return p.href;
  }
  return null;
}

/** Segmento que corresponde a una ruta. Si la ruta no es de ningún segmento, el primero. */
export function segmentoActivo(segmentos: readonly Segmento[], path: string): Segmento {
  return segmentos.find((s) => s.href === path) ?? segmentos[0];
}
