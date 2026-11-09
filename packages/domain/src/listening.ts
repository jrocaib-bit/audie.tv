import type { Book } from "./catalog";
import type { ListeningPath } from "./path";
import type { ProgressState } from "./progress";
import { clamp } from "./time";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function localIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function recordListeningDay(days: readonly string[], isoDate: string): string[] {
  if (!ISO_DATE.test(isoDate) || days.includes(isoDate)) return days as string[];
  return [...days, isoDate].sort();
}

export function listeningDayCount(days: readonly string[]): number {
  return new Set(days.filter((day) => ISO_DATE.test(day))).size;
}

export type PathProgress = {
  total: number;
  completed: number;
  fraction: number;
  nextEpisodeId: string | null;
};

export function pathProgress(
  path: ListeningPath,
  progress: ProgressState,
  playableIds: readonly string[],
): PathProgress {
  const steps = path.steps.filter((step) => playableIds.includes(step.episodeId));
  const completed = steps.filter((step) => progress.episodes[step.episodeId]?.completed).length;
  const next = steps.find((step) => !progress.episodes[step.episodeId]?.completed);
  return {
    total: steps.length,
    completed,
    fraction: steps.length === 0 ? 0 : completed / steps.length,
    nextEpisodeId: next?.episodeId ?? null,
  };
}

export type JourneyState = "heard" | "on_path" | "playable" | "ahead";

export function journeyState(
  bookId: string,
  path: ListeningPath,
  progress: ProgressState,
  playableByBook: Readonly<Record<string, string>>,
): JourneyState {
  const episodeId = playableByBook[bookId];
  if (!episodeId) return "ahead";
  if (progress.episodes[episodeId]?.completed) return "heard";
  if (path.steps.some((step) => step.episodeId === episodeId)) return "on_path";
  return "playable";
}

export function playableByBook(episodes: readonly { id: string; bookId: string; status: string }[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const episode of episodes) {
    if (episode.status === "playable") map[episode.bookId] = episode.id;
  }
  return map;
}

export function booksOnTheWay(books: readonly Book[]): Book[] {
  return [...books].sort((a, b) => a.order - b.order);
}

export function episodiosDeLibro<T extends { bookId: string; orden: number }>(episodios: readonly T[], bookId: string): T[] {
  return episodios.filter((episodio) => episodio.bookId === bookId).sort((a, b) => a.orden - b.orden);
}

/** Slow drift inside the frame. Reduced motion stays still. Never used to crop. */
export function artworkScale(spanProgress: number, reduceMotion: boolean): number {
  if (reduceMotion) return 1;
  return 1 + clamp(spanProgress, 0, 1) * 0.03;
}

export type ByteRange = { start: number; end: number };

export function parseByteRange(header: string | null, total: number): ByteRange | "full" | "unsatisfiable" {
  if (!header) return "full";
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match || total <= 0) return "unsatisfiable";
  const startRaw = match[1] ?? "";
  const endRaw = match[2] ?? "";
  let start: number;
  let end: number;
  if (startRaw === "" && endRaw !== "") {
    const suffix = Number(endRaw);
    if (!Number.isFinite(suffix) || suffix <= 0) return "unsatisfiable";
    start = Math.max(0, total - suffix);
    end = total - 1;
  } else {
    start = Number(startRaw);
    end = endRaw === "" ? total - 1 : Number(endRaw);
  }
  if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || start >= total || end < start) {
    return "unsatisfiable";
  }
  return { start, end: Math.min(end, total - 1) };
}
