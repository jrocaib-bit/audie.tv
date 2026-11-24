import { STORAGE_KEYS, parseProgress, type ProgressState } from "@audite/domain";

const CLAVE_BARRA = "audite.barra";

/** El episodio más reciente del progreso ya guardado (updatedAt). */
export function ultimoEpisodioEscuchado(progress: ProgressState): string | null {
  let mejor: { id: string; t: string } | null = null;
  for (const [id, e] of Object.entries(progress.episodes)) {
    const t = e.updatedAt || "";
    if (!mejor || t > mejor.t) mejor = { id, t };
  }
  return mejor?.id ?? null;
}

/**
 * Episodio en curso (barra persistente) o, si no hay, el último del progreso local.
 * Solo se llama en el cliente.
 */
export function episodioEscuchandoAhora(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const crudo = sessionStorage.getItem(CLAVE_BARRA);
    if (crudo) {
      const barra = JSON.parse(crudo) as { id?: string };
      if (typeof barra.id === "string" && barra.id.trim()) return barra.id;
    }
  } catch {
    /* sigue con el progreso */
  }
  try {
    return ultimoEpisodioEscuchado(parseProgress(JSON.parse(window.localStorage.getItem(STORAGE_KEYS.progress) || "null")));
  } catch {
    return null;
  }
}
