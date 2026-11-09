import type { ListeningPath } from "./path";
import { resumePosition, type ProgressState } from "./progress";

export type DailyPlan =
  | { kind: "nothing_playable"; plannedMinutes: number }
  | { kind: "empty_path"; plannedMinutes: number }
  | { kind: "path_complete"; plannedMinutes: number }
  | { kind: "continue"; episodeId: string; resumeSeconds: number; plannedMinutes: number };

export function dailyListening(input: {
  path: ListeningPath;
  progress: ProgressState;
  playableIds: readonly string[];
  durations: Readonly<Record<string, number>>;
  plannedMinutes: number;
}): DailyPlan {
  const plannedMinutes = input.plannedMinutes;
  if (input.playableIds.length === 0) return { kind: "nothing_playable", plannedMinutes };
  const steps = input.path.steps.filter((step) => input.playableIds.includes(step.episodeId));
  if (steps.length === 0) return { kind: "empty_path", plannedMinutes };
  const next = steps.find((step) => !input.progress.episodes[step.episodeId]?.completed);
  if (!next) return { kind: "path_complete", plannedMinutes };
  const duration = input.durations[next.episodeId] ?? 0;
  return {
    kind: "continue",
    episodeId: next.episodeId,
    resumeSeconds: resumePosition(input.progress.episodes[next.episodeId], duration),
    plannedMinutes,
  };
}
