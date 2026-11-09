import antiguosJson from "./rangos-v1.json";
import type { ListeningPath } from "./path";
import type { EpisodeProgress, ProgressState } from "./progress";

export type RangoEpisodio = {
  id: string;
  bookId: string;
  orden: number;
  rango: string;
};

type Tramo = { start: number; end: number };

const ANTIGUOS = antiguosJson.episodios as RangoEpisodio[];

export function rangosAntiguos(): readonly RangoEpisodio[] {
  return ANTIGUOS;
}

export function parseRango(rango: string | null | undefined): Tramo | null {
  if (!rango) return null;
  const match = /^(\d+):(\d+)-(\d+):(\d+)$/.exec(rango.trim());
  if (!match) return null;
  const start = Number(match[1]) * 1000 + Number(match[2]);
  const end = Number(match[3]) * 1000 + Number(match[4]);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return null;
  return { start, end };
}

function solapan(a: Tramo, b: Tramo): boolean {
  return a.start <= b.end && b.start <= a.end;
}

function contiene(exterior: Tramo, interior: Tramo): boolean {
  return exterior.start <= interior.start && interior.end <= exterior.end;
}

function igual(a: Tramo, b: Tramo): boolean {
  return a.start === b.start && a.end === b.end;
}

function candidatos(antiguo: RangoEpisodio, nuevos: readonly RangoEpisodio[]) {
  const viejo = parseRango(antiguo.rango);
  if (!viejo) return [];
  return nuevos
    .filter((episodio) => episodio.bookId === antiguo.bookId)
    .flatMap((episodio) => {
      const tramo = parseRango(episodio.rango);
      if (!tramo || !solapan(viejo, tramo)) return [];
      return [{ episodio, tramo }];
    })
    .sort((a, b) => a.tramo.start - b.tramo.start || a.episodio.orden - b.episodio.orden);
}

function primeroNuevo(antiguo: RangoEpisodio, nuevos: readonly RangoEpisodio[]): { id: string; identico: boolean } | null {
  const lista = candidatos(antiguo, nuevos);
  const primero = lista[0];
  if (!primero) return null;
  const viejo = parseRango(antiguo.rango);
  return { id: primero.episodio.id, identico: viejo != null && igual(viejo, primero.tramo) };
}

export function migrarProgreso(progress: ProgressState, nuevos: readonly RangoEpisodio[]): ProgressState {
  if ((progress.revision ?? 1) >= 2) return progress;
  const episodes: Record<string, EpisodeProgress> = {};
  for (const [id, entry] of Object.entries(progress.episodes)) {
    const antiguo = ANTIGUOS.find((episodio) => episodio.id === id);
    if (!antiguo) {
      if (nuevos.some((episodio) => episodio.id === id) && !episodes[id]) episodes[id] = entry;
      continue;
    }
    const viejo = parseRango(antiguo.rango);
    if (!viejo) continue;
    if (entry.completed) {
      for (const { episodio, tramo } of candidatos(antiguo, nuevos)) {
        if (!contiene(viejo, tramo) || episodes[episodio.id]) continue;
        episodes[episodio.id] = { positionSeconds: 0, completed: true, updatedAt: entry.updatedAt };
      }
      continue;
    }
    const destino = primeroNuevo(antiguo, nuevos);
    if (!destino || episodes[destino.id]?.completed) continue;
    episodes[destino.id] = {
      positionSeconds: destino.identico ? entry.positionSeconds : 0,
      completed: false,
      updatedAt: entry.updatedAt,
    };
  }
  return { version: 1, revision: 2, episodes, listenedOn: progress.listenedOn ?? [] };
}

export function migrarCamino(path: ListeningPath, nuevos: readonly RangoEpisodio[]): ListeningPath {
  if ((path.revision ?? 1) >= 2) return path;
  const steps: { episodeId: string }[] = [];
  for (const step of path.steps) {
    const antiguo = ANTIGUOS.find((episodio) => episodio.id === step.episodeId);
    const destino = antiguo ? primeroNuevo(antiguo, nuevos) : nuevos.some((episodio) => episodio.id === step.episodeId) ? { id: step.episodeId, identico: true } : null;
    if (!destino || steps.some((item) => item.episodeId === destino.id)) continue;
    steps.push({ episodeId: destino.id });
  }
  return { version: 1, revision: 2, steps, updatedAt: path.updatedAt };
}
