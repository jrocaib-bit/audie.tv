import tabla from "../../web/src/data/bucles.json";

type BucleCrudo = { mp4?: string; webm?: string; poster?: string; alt?: string };

export type BucleMovil = { mp4: string; webm: string; poster: string; alt: string };

/** Misma tabla que la web. Vacía: el reproductor sigue con el cuadro. */
export function bucleDe(id: string): BucleMovil | null {
  const fila = (tabla as Record<string, BucleCrudo>)[id];
  const mp4 = fila?.mp4?.trim() ?? "";
  const webm = fila?.webm?.trim() ?? "";
  if (!mp4 && !webm) return null;
  return { mp4, webm, poster: fila?.poster?.trim() ?? "", alt: fila?.alt?.trim() ?? "" };
}
