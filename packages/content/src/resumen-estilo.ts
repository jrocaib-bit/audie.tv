/**
 * Capa de estilo sobre los resúmenes del catálogo.
 *
 * La fuente de los textos es el manifiesto (01_canon). Ese archivo no se modifica.
 * Las correcciones viven en content/catalog/resumenes-estilo.json y se aplican al leer.
 * Solo hay entradas para los episodios (y lenguas) que cambian.
 */
import correcciones from "../../../content/catalog/resumenes-estilo.json";

export type ResumenBilingue = { es: string; en: string };

const capa = correcciones as Record<string, { es?: string; en?: string }>;

export function aplicarResumenEstilo(
  id: string,
  resumen?: { es?: string; en?: string } | null,
): ResumenBilingue {
  const sobre = capa[id];
  return {
    es: (sobre?.es ?? resumen?.es ?? "").trim(),
    en: (sobre?.en ?? resumen?.en ?? "").trim(),
  };
}

export function idsConCorreccionEstilo(): string[] {
  return Object.keys(capa);
}
