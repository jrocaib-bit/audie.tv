import type { PlayerStatus } from "./player";

export type EpisodeProgress = {
  positionSeconds: number;
  updatedAt: string;
  completed: boolean;
};

export type ProgressState = {
  version: 1;
  revision?: number;
  episodes: Record<string, EpisodeProgress>;
  listenedOn: string[];
};

export function emptyProgress(): ProgressState {
  return { version: 1, episodes: {}, listenedOn: [] };
}

const COMPLETION_MARGIN = 1.25;

export function isCompletedPosition(positionSeconds: number, durationSeconds: number, status: PlayerStatus): boolean {
  if (status === "ended") return true;
  return durationSeconds > 0 && positionSeconds >= durationSeconds - COMPLETION_MARGIN;
}

export function recordListen(
  progress: ProgressState,
  episodeId: string,
  positionSeconds: number,
  durationSeconds: number,
  status: PlayerStatus,
  now: string,
): ProgressState {
  const completed = isCompletedPosition(positionSeconds, durationSeconds, status);
  return {
    version: 1,
    revision: progress.revision,
    listenedOn: progress.listenedOn ?? [],
    episodes: {
      ...progress.episodes,
      [episodeId]: {
        positionSeconds: completed ? durationSeconds : Math.max(0, positionSeconds),
        updatedAt: now,
        completed,
      },
    },
  };
}

export function resumePosition(entry: EpisodeProgress | undefined, durationSeconds: number): number {
  if (!entry || entry.completed) return 0;
  if (entry.positionSeconds < 1) return 0;
  if (durationSeconds > 0 && entry.positionSeconds >= durationSeconds - COMPLETION_MARGIN) return 0;
  if (durationSeconds > 0) return Math.min(entry.positionSeconds, durationSeconds);
  return entry.positionSeconds;
}

export function parseProgress(value: unknown): ProgressState {
  if (!value || typeof value !== "object") return emptyProgress();
  const episodes = (value as { episodes?: unknown }).episodes;
  if (!episodes || typeof episodes !== "object") return emptyProgress();
  const listenedOn = (value as { listenedOn?: unknown }).listenedOn;
  const revision = (value as { revision?: unknown }).revision;
  const next: ProgressState = {
    ...emptyProgress(),
    revision: typeof revision === "number" ? revision : undefined,
    listenedOn: Array.isArray(listenedOn)
      ? listenedOn.filter((day): day is string => typeof day === "string" && /^\d{4}-\d{2}-\d{2}$/.test(day))
      : [],
  };
  for (const [id, raw] of Object.entries(episodes)) {
    if (!raw || typeof raw !== "object") continue;
    const entry = raw as Partial<EpisodeProgress>;
    if (typeof entry.positionSeconds !== "number" || !Number.isFinite(entry.positionSeconds)) continue;
    next.episodes[id] = {
      positionSeconds: Math.max(0, entry.positionSeconds),
      updatedAt: typeof entry.updatedAt === "string" ? entry.updatedAt : "",
      completed: entry.completed === true,
    };
  }
  return next;
}
