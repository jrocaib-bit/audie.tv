import { racha } from "@audite/domain";
import { esPortadaProvisional, obraDeEpisodio, obraWebp } from "../../../packages/content/src/obras-visibles";
import { PROFECIAS_ID, type RetoJson } from "./retos-app";

const ADVIENTO_ID = "adviento-isaias";

function libroDe(episodio: string): string {
  return episodio.replace(/-\d+$/, "");
}

export const PORTADA_ADVIENTO = "/obras/reto-adviento_o2-1x1.webp";
export const PORTADA_PROFECIAS = "/obras/reto-profecias_o1-1x1.webp";

/** Portada del reto (cuadrada) para la app. */
export function portadaDeRetoApp(id: string): string {
  if (id === ADVIENTO_ID) return PORTADA_ADVIENTO;
  if (id === PROFECIAS_ID) return PORTADA_PROFECIAS;
  return "";
}

/** Pintura del día de Profecías (obra completa, sin rótulo). */
export function pinturaDeProfecias(episodio?: string): string {
  if (!episodio || !/^pp-\d\d$/.test(episodio)) return "";
  return `/obras/reto-profecias_${episodio}.webp`;
}

/**
 * Pintura de cada día: la del episodio si es del mismo libro y no se ha usado ya.
 * Nunca se toma `paso.obra` de otro libro (en Adviento venía un gn-* por día).
 * Si no hay obra adecuada, se usa la portada del reto, no una pintura arbitraria.
 */
export function pinturasDeReto(reto: Pick<RetoJson, "id" | "pasos">): string[] {
  const portada = portadaDeRetoApp(reto.id);
  const usadas = new Set<string>(portada ? [portada] : []);
  return reto.pasos.map((paso) => {
    if (reto.id === PROFECIAS_ID) {
      const src = pinturaDeProfecias(paso.episodio);
      if (src && !usadas.has(src)) {
        usadas.add(src);
        return src;
      }
      return portada;
    }
    const episodio = paso.episodio;
    const libro = episodio ? libroDe(episodio) : "";
    const obra = episodio && !esPortadaProvisional(episodio) ? obraDeEpisodio(episodio) : null;
    if (obra && libro && libroDe(obra.episodio) === libro) {
      const src = obraWebp(obra);
      if (src && !usadas.has(src)) {
        usadas.add(src);
        return src;
      }
    }
    return portada;
  });
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

type Avance = {
  episodes: Record<string, { completed?: boolean; updatedAt?: string } | undefined>;
};

/** Racha del reto: días seguidos en los que se completó un episodio de este reto. 0 si no hay. */
export function rachaDeReto(pasos: { episodio?: string }[], progress: Avance, hoyIso: string): number {
  const dias: string[] = [];
  for (const paso of pasos) {
    const ev = paso.episodio ? progress.episodes[paso.episodio] : undefined;
    if (!ev?.completed || !ev.updatedAt) continue;
    const dia = ev.updatedAt.slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(dia)) dias.push(dia);
  }
  return racha([...new Set(dias)], hoyIso);
}
