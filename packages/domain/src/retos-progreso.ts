export type ProgresoReto = { hechos: number[]; fechas: string[] };

export type ResultadoMarcaReto = {
  progreso: ProgresoReto;
  /** El día pasó de pendiente a hecho (no al desmarcar ni al repetir). */
  nuevo: boolean;
  /** Con este día quedan hechos todos los pasos del reto. */
  completado: boolean;
};

/** Alterna un día (como el check de la web) y dice si hay que emitir challenge_day_completed / challenge_completed. */
export function alternarDiaReto(actual: ProgresoReto | undefined, dia: number, totalPasos: number, hoy: string): ResultadoMarcaReto {
  const base = actual ?? { hechos: [], fechas: [] };
  const tenia = base.hechos.includes(dia);
  const hechos = tenia ? base.hechos.filter((d) => d !== dia) : [...base.hechos, dia];
  const fechas = tenia ? base.fechas.filter((f) => f !== hoy) : [...new Set([...base.fechas, hoy])];
  return { progreso: { hechos, fechas }, nuevo: !tenia, completado: !tenia && totalPasos > 0 && hechos.length >= totalPasos };
}

export function leerProgresoRetos(raw: string | null): Record<string, ProgresoReto> {
  if (!raw) return {};
  try {
    const valor = JSON.parse(raw) as unknown;
    return valor && typeof valor === "object" && !Array.isArray(valor) ? (valor as Record<string, ProgresoReto>) : {};
  } catch {
    return {};
  }
}
