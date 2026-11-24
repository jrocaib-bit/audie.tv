/** Métricas de página del lector: alturas de línea, sangría, cabecera y bloques medibles. Sin React Native. */
import type { BloqueLibro, CapituloLibro } from "@audite/domain";
import type { BloqueMedido } from "./paginacion";

export const SANGRIA = "  ";
export const MARGEN_PAGINA = 28;

export function metricas(tamano: number) {
  const lh = Math.round(tamano * 1.55);
  const fsTitulo = Math.round(tamano * 1.6);
  return { lh, fsTitulo, lhTitulo: Math.round(fsTitulo * 1.15), lhRotulo: 18 };
}

/** Alto de la cabecera del capítulo: rótulo, título con sus líneas y aire. */
export function altoCabecera(lineasTitulo: number, tamano: number): number {
  const m = metricas(tamano);
  return m.lhRotulo + 8 + Math.max(1, lineasTitulo) * m.lhTitulo + 28;
}

/** Sangría de primera línea: solo en el párrafo que sigue a otro párrafo. */
export function llevaSangria(bloque: Pick<BloqueLibro, "tipo">, previo: Pick<BloqueLibro, "tipo"> | undefined): boolean {
  return bloque.tipo === "parrafo" && previo?.tipo === "parrafo";
}

export function espacioSobre(bloque: Pick<BloqueLibro, "tipo">, previo: Pick<BloqueLibro, "tipo"> | undefined, tamano: number): number {
  const { lh } = metricas(tamano);
  if (bloque.tipo === "subtitulo") return Math.round(lh * 0.9);
  if (bloque.tipo === "pasaje") return Math.round(lh * 0.35);
  return previo?.tipo === "pasaje" ? Math.round(lh * 0.35) : 0;
}

/**
 * Bloques del capítulo listos para paginar. El primero es la cabecera. `lineas[0]` son las líneas del título
 * y `lineas[i + 1]` las del bloque i.
 */
export function bloquesMedibles(capitulo: Pick<CapituloLibro, "bloques">, lineas: readonly number[], tamano: number): BloqueMedido[] {
  const { lh } = metricas(tamano);
  const salida: BloqueMedido[] = [{ id: "cabecera", lineas: 1, altoLinea: altoCabecera(lineas[0] ?? 1, tamano), antes: 0, indivisible: true }];
  capitulo.bloques.forEach((b, i) => {
    salida.push({
      id: b.id,
      lineas: Math.max(1, lineas[i + 1] ?? 1),
      altoLinea: lh,
      antes: espacioSobre(b, capitulo.bloques[i - 1], tamano),
      conSiguiente: b.tipo === "subtitulo",
    });
  });
  return salida;
}

/** Alto útil de la página: la pantalla menos las zonas del título y del número de página. */
export function altoUtilPagina(alto: number, insetSuperior: number, insetInferior: number): number {
  return Math.max(200, Math.floor(alto - (insetSuperior + 56) - (insetInferior + 56)));
}
