export type CitaRef = {
  libroId: string;
  capitulo: number;
  versiculo: number;
};

export type ReferenciaCruzada = {
  desde: CitaRef;
  hacia: CitaRef;
  orden: number;
};

export type MarcoEscucha = {
  episodeId: string;
  segundo: number;
  cita: string;
};

export const ATRIBUCION_REFERENCIAS = "Cross references from OpenBible.info, CC BY 4.0. https://www.openbible.info/labs/cross-references/";

export function referenciasDe(lista: readonly ReferenciaCruzada[], cita: CitaRef): ReferenciaCruzada[] {
  return lista
    .filter((item) => item.desde.libroId === cita.libroId && item.desde.capitulo === cita.capitulo && item.desde.versiculo === cita.versiculo)
    .sort((a, b) => a.orden - b.orden);
}

export function etiquetaCita(cita: CitaRef, nombre: string): string {
  return `${nombre} ${cita.capitulo}:${cita.versiculo}`;
}

export function entrarReferencia(pila: readonly MarcoEscucha[], marco: MarcoEscucha): MarcoEscucha[] {
  return [...pila, marco];
}

export function volverReferencia(pila: readonly MarcoEscucha[]): { pila: MarcoEscucha[]; marco: MarcoEscucha | null } {
  if (pila.length === 0) return { pila: [], marco: null };
  const marco = pila[pila.length - 1] ?? null;
  return { pila: pila.slice(0, -1), marco };
}
