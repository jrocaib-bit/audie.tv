export type MediaSegment = {
  id: string;
  url: string;
  startSeconds: number;
  durationSeconds: number;
};

export function episodeDuration(segments: readonly MediaSegment[]): number {
  return segments.reduce(
    (end, segment) => Math.max(end, segment.startSeconds + segment.durationSeconds),
    0,
  );
}

export function segmentAt(
  segments: readonly MediaSegment[],
  globalSeconds: number,
): { segment: MediaSegment; localSeconds: number } | null {
  if (segments.length === 0) return null;
  const duration = episodeDuration(segments);
  const time = Math.min(Math.max(globalSeconds, 0), duration);
  if (time >= duration) {
    const last = segments[segments.length - 1];
    return { segment: last, localSeconds: last.durationSeconds };
  }
  const segment =
    segments.find(
      (item) => time >= item.startSeconds && time < item.startSeconds + item.durationSeconds,
    ) ?? segments[0];
  return { segment, localSeconds: Math.max(0, time - segment.startSeconds) };
}

export type TimeRange = { start: number; end: number };

export function rangeDiscontinuities(ranges: readonly TimeRange[], tolerance = 0.001): string[] {
  if (ranges.length === 0) return ["empty"];
  const ordered = [...ranges].sort((a, b) => a.start - b.start);
  const issues: string[] = [];
  if (Math.abs(ordered[0].start) > tolerance) issues.push("does not start at 0");
  for (let index = 1; index < ordered.length; index += 1) {
    const gap = ordered[index].start - ordered[index - 1].end;
    if (Math.abs(gap) > tolerance) {
      issues.push(`discontinuity of ${gap}s before ${ordered[index].start}`);
    }
  }
  return issues;
}
