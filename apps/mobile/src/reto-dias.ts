import { esPortadaProvisional, obraDeEpisodio, obraWebp, obrasVisibles } from "../../../packages/content/src/obras-visibles";
import type { RetoJson } from "./retos-app";

function srcLibre(episodio: string | undefined, usadas: Set<string>): string | null {
  if (!episodio || esPortadaProvisional(episodio)) return null;
  const obra = obraDeEpisodio(episodio);
  if (!obra) return null;
  const src = obraWebp(obra);
  return usadas.has(src) ? null : src;
}

/**
 * Una pintura por día y ninguna repetida: la del día, la de su episodio o, si ya salió,
 * otra del mismo libro y, al final, la primera libre del catálogo. Sin pintura (`sinObra`): "" (placa de marca).
 */
export function pinturasDeReto(reto: Pick<RetoJson, "pasos" | "sinObra">): string[] {
  if (reto.sinObra) return reto.pasos.map(() => "");
  const usadas = new Set<string>();
  const visibles = obrasVisibles().filter((o) => !esPortadaProvisional(o.episodio));
  const salida: string[] = [];
  for (const paso of reto.pasos) {
    let src = srcLibre(paso.obra, usadas) ?? srcLibre(paso.episodio, usadas);
    if (!src) {
      const libro = (paso.obra ?? paso.episodio ?? "").split("-")[0];
      const candidatas = [...visibles.filter((o) => o.libro === libro), ...visibles];
      const obra = candidatas.find((o) => !usadas.has(obraWebp(o)));
      src = obra ? obraWebp(obra) : "";
    }
    if (src) usadas.add(src);
    salida.push(src);
  }
  return salida;
}

function diasUtc(iso: string): number {
  const [a, m, d] = iso.split("-").map(Number);
  return Date.UTC(a ?? 1970, (m ?? 1) - 1, d ?? 1) / 86_400_000;
}

/** Días que faltan para empezar (0 si ya empezó). */
export function diasParaEmpezar(inicio: string, hoyIso: string): number {
  return Math.max(0, Math.round(diasUtc(inicio) - diasUtc(hoyIso)));
}

/** Posición (0-based) del día de hoy en el reto, o null si el reto no está en curso. */
export function indiceDeHoy(inicio: string, hoyIso: string, total: number): number | null {
  const i = Math.round(diasUtc(hoyIso) - diasUtc(inicio));
  return i >= 0 && i < total ? i : null;
}
