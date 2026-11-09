export const SLEEP_CHOICES = [15, 30, 45] as const;
export type SleepMinutes = (typeof SLEEP_CHOICES)[number];

export function isSleepMinutes(value: number): value is SleepMinutes {
  return (SLEEP_CHOICES as readonly number[]).includes(value);
}

export function sleepDeadline(minutes: SleepMinutes, nowMs: number): number {
  return nowMs + minutes * 60_000;
}

export function sleepRemainingMs(deadlineMs: number | null, nowMs: number): number | null {
  if (deadlineMs == null) return null;
  return Math.max(0, deadlineMs - nowMs);
}

export function sleepHasElapsed(deadlineMs: number | null, nowMs: number): boolean {
  return deadlineMs != null && nowMs >= deadlineMs;
}

export function formatSleepRemaining(remainingMs: number | null): string | null {
  if (remainingMs == null) return null;
  const total = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
