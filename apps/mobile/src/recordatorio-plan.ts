import { parsePlanAviso, type PlanAviso } from "@audite/domain";

export const HORAS_RECORDATORIO = [7, 8, 13, 21, 22] as const;

export function planDiario(hora: number, activo: boolean): PlanAviso {
  return parsePlanAviso({ activo, hora, minuto: 0, dias: [0, 1, 2, 3, 4, 5, 6] });
}

export function horaTexto(hora: number): string {
  return `${hora}:00`;
}
