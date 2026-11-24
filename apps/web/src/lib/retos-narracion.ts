import narracionJson from "../../../../content/tiempos/retos-narracion.json";

export type NarracionDia = { es: string[]; en: string[] };

type ParrafoJson = { texto: { es: string; en: string } };
type ArchivoNarracion = { version: number; retos: Record<string, Record<string, { parrafos: ParrafoJson[] }>> };

const ARCHIVO = narracionJson as ArchivoNarracion;

/** Relato del día, en párrafos breves. Vacío si el día aún no tiene relato (la ficha cae a la lista compacta). */
export function narracionDeDia(retoId: string, clave: string): NarracionDia | undefined {
  const dia = ARCHIVO.retos[retoId]?.[clave];
  if (!dia || dia.parrafos.length === 0) return undefined;
  return { es: dia.parrafos.map((p) => p.texto.es), en: dia.parrafos.map((p) => p.texto.en) };
}

export function retosNarrados(): { reto: string; dias: number }[] {
  return Object.entries(ARCHIVO.retos).map(([reto, dias]) => ({ reto, dias: Object.keys(dias).length }));
}
