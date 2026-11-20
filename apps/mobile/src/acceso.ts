import retosJson from "../../../content/tiempos/retos.json";

type Reto = { id: string; pasos: { episodio?: string }[] };

/** Gratis con cuenta gratuita, hoy: gn-01 (refleja AUDIO_GRATIS del servidor) y el Adviento. El resto, Premium. */
export const GRATIS_BASE: readonly string[] = ["gn-01"];

export function episodiosDeReto(retoId: string): string[] {
  const reto = (retosJson.retos as Reto[]).find((item) => item.id === retoId);
  return (reto?.pasos ?? []).map((paso) => paso.episodio).filter((id): id is string => Boolean(id));
}

export function idsGratisConCuenta(): Set<string> {
  return new Set([...GRATIS_BASE, ...episodiosDeReto("adviento-isaias")]);
}

export function esGratisConCuenta(id: string): boolean {
  return idsGratisConCuenta().has(id);
}

export type TipoAcceso = "gratis" | "premium" | "proximamente";

/** Marca que se enseña en las listas. */
export function tipoAcceso(id: string, grabado: boolean): TipoAcceso {
  if (!grabado) return "proximamente";
  return esGratisConCuenta(id) ? "gratis" : "premium";
}

export type DecisionPlay = "play" | "cuenta" | "premium" | "proximamente";

/**
 * Qué hacer al pulsar play. En la app, escuchar pide cuenta (incluso lo gratis).
 * `premium`: true/false si se sabe si hay suscripción; null si no se sabe (se pide y manda el servidor).
 */
export function decidirReproduccion(entrada: { id: string; grabado: boolean; haySesion: boolean; premium?: boolean | null }): DecisionPlay {
  if (!entrada.grabado) return "proximamente";
  if (!entrada.haySesion) return "cuenta";
  if (esGratisConCuenta(entrada.id)) return "play";
  if (entrada.premium === false) return "premium";
  return "play";
}

/** Episodio pendiente de reproducir que ya puede arrancar porque hay sesión. */
export function pendienteListo(pendiente: string | null, haySesion: boolean): string | null {
  return pendiente && haySesion ? pendiente : null;
}
