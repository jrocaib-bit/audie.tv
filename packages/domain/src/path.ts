export type ListeningPath = {
  version: 1;
  revision?: number;
  steps: { episodeId: string }[];
  updatedAt: string;
};

export type PathFailure = "unavailable" | "duplicate" | "missing";

export type PathResult =
  | { ok: true; path: ListeningPath }
  | { ok: false; path: ListeningPath; reason: PathFailure };

export function emptyPath(now = ""): ListeningPath {
  return { version: 1, steps: [], updatedAt: now };
}

export function addToPath(
  path: ListeningPath,
  episodeId: string,
  playableIds: readonly string[],
  now: string,
): PathResult {
  if (!playableIds.includes(episodeId)) return { ok: false, path, reason: "unavailable" };
  if (path.steps.some((step) => step.episodeId === episodeId)) {
    return { ok: false, path, reason: "duplicate" };
  }
  return {
    ok: true,
    path: { version: 1, steps: [...path.steps, { episodeId }], updatedAt: now },
  };
}

export function removeFromPath(path: ListeningPath, episodeId: string, now: string): PathResult {
  if (!path.steps.some((step) => step.episodeId === episodeId)) {
    return { ok: false, path, reason: "missing" };
  }
  return {
    ok: true,
    path: {
      version: 1,
      steps: path.steps.filter((step) => step.episodeId !== episodeId),
      updatedAt: now,
    },
  };
}

export function moveStep(path: ListeningPath, index: number, direction: -1 | 1, now: string): PathResult {
  const target = index + direction;
  if (index < 0 || index >= path.steps.length || target < 0 || target >= path.steps.length) {
    return { ok: false, path, reason: "missing" };
  }
  const steps = path.steps.map((step) => ({ ...step }));
  const [moved] = steps.splice(index, 1);
  steps.splice(target, 0, moved);
  return { ok: true, path: { version: 1, steps, updatedAt: now } };
}

export function sanitizePath(path: ListeningPath, playableIds: readonly string[], now: string): ListeningPath {
  const steps = path.steps.filter((step) => playableIds.includes(step.episodeId));
  if (steps.length === path.steps.length) return path;
  return { version: 1, steps, updatedAt: now || path.updatedAt };
}

export function parsePath(value: unknown): ListeningPath {
  if (!value || typeof value !== "object") return emptyPath();
  const rawSteps = (value as { steps?: unknown }).steps;
  if (!Array.isArray(rawSteps)) return emptyPath();
  const steps = rawSteps
    .map((step) => {
      if (!step || typeof step !== "object") return null;
      const episodeId = (step as { episodeId?: unknown }).episodeId;
      return typeof episodeId === "string" && episodeId.length > 0 ? { episodeId } : null;
    })
    .filter((step): step is { episodeId: string } => step !== null);
  const updatedAt = (value as { updatedAt?: unknown }).updatedAt;
  const revision = (value as { revision?: unknown }).revision;
  return {
    version: 1,
    revision: typeof revision === "number" ? revision : undefined,
    steps,
    updatedAt: typeof updatedAt === "string" ? updatedAt : "",
  };
}
