import narracionJson from "./datos/retos-narracion.json";

export type NarracionDia = { es: string[]; en: string[] };
type ArchivoNarracion = { version: number; retos: Record<string, Record<string, { parrafos: { texto: { es: string; en: string } }[] }>> };

/** Relato del día empaquetado (mismo fichero que la web: content/tiempos/retos-narracion.json). */
export function narracionDeDia(retoId: string, clave: string): NarracionDia | undefined {
  const dia = (narracionJson as ArchivoNarracion).retos[retoId]?.[clave];
  if (!dia || dia.parrafos.length === 0) return undefined;
  return { es: dia.parrafos.map((p) => p.texto.es), en: dia.parrafos.map((p) => p.texto.en) };
}

export type ParteDia = "escuchar" | "titulo" | "relato" | "lecturas" | "referencias" | "descripcion" | "relacionados";

/**
 * Orden de la ficha del día. Con relato: escuchar, título, relato y, al final, «Lecturas del día» plegable
 * (referencias y episodios). Sin relato: la ficha compacta de siempre.
 */
export function partesDelDia(datos: { narracion?: string[]; referencias?: unknown[]; descripcion?: string; relacionados?: unknown[] }): ParteDia[] {
  const hayLecturas = (datos.referencias?.length ?? 0) > 0 || (datos.relacionados?.length ?? 0) > 0;
  if ((datos.narracion?.length ?? 0) > 0) return ["escuchar", "titulo", "relato", ...(hayLecturas ? (["lecturas"] as const) : [])];
  const partes: ParteDia[] = ["titulo"];
  if ((datos.referencias?.length ?? 0) > 0) partes.push("referencias");
  if (datos.descripcion) partes.push("descripcion");
  if ((datos.relacionados?.length ?? 0) > 0) partes.push("relacionados");
  return partes;
}
