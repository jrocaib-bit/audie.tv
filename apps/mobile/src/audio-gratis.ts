import retosJson from "../../../content/tiempos/retos.json";

type Reto = { id: string; pasos: { episodio?: string }[] };

/** Refleja AUDIO_GRATIS del servidor hoy. El servidor decide; esto solo avisa en la interfaz. */
export const AUDIO_GRATIS_BASE: readonly string[] = ["gn-01"];

export function episodiosDeReto(retoId: string): string[] {
  const reto = (retosJson.retos as Reto[]).find((item) => item.id === retoId);
  return (reto?.pasos ?? []).map((paso) => paso.episodio).filter((id): id is string => Boolean(id));
}

/** Gratis sin sesión: gn-01 y todos los episodios del reto de Adviento. */
export function idsGratisAnonimo(): Set<string> {
  return new Set([...AUDIO_GRATIS_BASE, ...episodiosDeReto("adviento-isaias")]);
}

export function esGratisAnonimo(id: string): boolean {
  return idsGratisAnonimo().has(id);
}

/** Sin sesión, lo que no es gratis pide entrar. Con sesión, manda el servidor. */
export function bloqueadoPorSesion(id: string, haySesion: boolean): boolean {
  return !haySesion && !esGratisAnonimo(id);
}
