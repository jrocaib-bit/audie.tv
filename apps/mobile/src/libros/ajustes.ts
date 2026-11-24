/** Ajustes del lector. Sin React Native: se prueban con Vitest. Compatible hacia atrás con `{ tam, noche }`. */
export type TemaLector = "dia" | "sepia" | "noche";
export type ModoLector = "paginas" | "scroll";
export type AjustesLector = { tam: number; noche: boolean | null; tema: TemaLector | null; modo: ModoLector };

export const AJUSTES_INICIALES: AjustesLector = { tam: 1, noche: null, tema: null, modo: "paginas" };

export function parseAjustes(bruto: unknown): AjustesLector {
  const d = (bruto && typeof bruto === "object" ? bruto : {}) as Record<string, unknown>;
  const tema = d.tema === "dia" || d.tema === "sepia" || d.tema === "noche" ? d.tema : null;
  return {
    tam: typeof d.tam === "number" && d.tam >= 0 && d.tam <= 3 ? Math.trunc(d.tam) : 1,
    noche: typeof d.noche === "boolean" ? d.noche : null,
    tema,
    modo: d.modo === "scroll" ? "scroll" : "paginas",
  };
}

/** Tema efectivo: el elegido; si no hay, el antiguo día/noche; si tampoco, el de la app. */
export function temaEfectivo(a: Pick<AjustesLector, "noche" | "tema">, appOscura: boolean): TemaLector {
  if (a.tema) return a.tema;
  if (a.noche !== null) return a.noche ? "noche" : "dia";
  return appOscura ? "noche" : "dia";
}
