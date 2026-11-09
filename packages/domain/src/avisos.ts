export type DiaAviso = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type PlanAviso = {
  activo: boolean;
  hora: number;
  minuto: number;
  dias: DiaAviso[];
};

export const CLAVE_AVISOS = "audite.avisos.v1";

const DIAS: readonly DiaAviso[] = [0, 1, 2, 3, 4, 5, 6];

export function planVacio(): PlanAviso {
  return { activo: false, hora: 8, minuto: 0, dias: [1, 2, 3, 4, 5] };
}

export function parsePlanAviso(value: unknown): PlanAviso {
  const base = planVacio();
  if (!value || typeof value !== "object") return base;
  const record = value as Partial<PlanAviso>;
  const hora = typeof record.hora === "number" && record.hora >= 0 && record.hora <= 23 ? Math.floor(record.hora) : base.hora;
  const minuto = typeof record.minuto === "number" && record.minuto >= 0 && record.minuto <= 59 ? Math.floor(record.minuto) : base.minuto;
  const dias = Array.isArray(record.dias)
    ? [...new Set(record.dias.filter((dia): dia is DiaAviso => DIAS.includes(dia as DiaAviso)))].sort((a, b) => a - b)
    : base.dias;
  return { activo: record.activo === true, hora, minuto, dias };
}

export function textoAviso(locale: "es" | "en", libro: string, capitulo: number): string {
  const limpio = libro.trim();
  const numero = Number.isFinite(capitulo) ? Math.max(1, Math.floor(capitulo)) : 1;
  if (locale === "en") return `Next: ${limpio} ${numero}`;
  return `Te toca ${limpio} ${numero}`;
}

export function proximosAvisos(plan: PlanAviso, ahora: Date, texto: string): { en: string; texto: string }[] {
  if (!plan.activo || plan.dias.length === 0 || !texto.trim()) return [];
  const salida: { en: string; texto: string }[] = [];
  for (let desplazamiento = 0; desplazamiento < 8; desplazamiento += 1) {
    const fecha = new Date(ahora.getTime());
    fecha.setDate(ahora.getDate() + desplazamiento);
    fecha.setHours(plan.hora, plan.minuto, 0, 0);
    if (!plan.dias.includes(fecha.getDay() as DiaAviso)) continue;
    if (fecha.getTime() <= ahora.getTime()) continue;
    salida.push({ en: fecha.toISOString(), texto });
  }
  return salida;
}
