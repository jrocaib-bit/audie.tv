import type { Reto, TiempoId } from "@audite/domain";
import retosJson from "../../../../content/tiempos/retos.json";

export const RETOS = retosJson.retos as Reto[];

export function retosDeTiempo(tiempo: TiempoId): Reto[] {
  if (tiempo === "triduo") return RETOS.filter((reto) => reto.tiempo === "semana-santa");
  return RETOS.filter((reto) => reto.tiempo === tiempo);
}
