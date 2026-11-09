import { describe, expect, it } from "vitest";
import { emptyPath, addToPath } from "./path";
import { emptyProgress, recordListen } from "./progress";
import { frameAt } from "./presentation";
import { artworkScale, listeningDayCount, localIsoDate, parseByteRange, pathProgress, recordListeningDay } from "./listening";
import { formatSleepRemaining, sleepDeadline, sleepHasElapsed, sleepRemainingMs } from "./sleep";
import type { CaptionCue, ImageCue } from "./catalog";

describe("sleep timer", () => {
  it("counts down and elapses exactly at the deadline", () => {
    const now = 1_000_000;
    const deadline = sleepDeadline(15, now);
    expect(deadline - now).toBe(15 * 60_000);
    expect(sleepRemainingMs(deadline, now + 60_000)).toBe(14 * 60_000);
    expect(sleepHasElapsed(deadline, deadline - 1)).toBe(false);
    expect(sleepHasElapsed(deadline, deadline)).toBe(true);
    expect(sleepHasElapsed(null, now)).toBe(false);
    expect(formatSleepRemaining(90_000)).toBe("1:30");
    expect(formatSleepRemaining(null)).toBeNull();
  });
});

describe("path progress", () => {
  it("reports the next unheard step and a finished path", () => {
    const available = ["es-genesis-01"];
    const added = addToPath(emptyPath(), "es-genesis-01", available, "t");
    if (!added.ok) throw new Error("path");
    expect(pathProgress(added.path, emptyProgress(), available)).toEqual({
      total: 1,
      completed: 0,
      fraction: 0,
      nextEpisodeId: "es-genesis-01",
    });
    const heard = recordListen(emptyProgress(), "es-genesis-01", 498, 498, "ended", "t2");
    expect(pathProgress(added.path, heard, available).fraction).toBe(1);
    expect(pathProgress(added.path, heard, available).nextEpisodeId).toBeNull();
    expect(pathProgress(emptyPath(), emptyProgress(), available).fraction).toBe(0);
  });
});

describe("listening days", () => {
  it("counts a calendar day once and ignores a bad date", () => {
    const once = recordListeningDay([], "2026-11-09");
    const twice = recordListeningDay(once, "2026-11-09");
    const next = recordListeningDay(twice, "2026-11-10");
    expect(listeningDayCount(next)).toBe(2);
    expect(recordListeningDay(next, "nope")).toEqual(next);
    expect(localIsoDate(new Date(2026, 10, 9, 23, 30))).toBe("2026-11-09");
  });
});

describe("artwork timing", () => {
  const cues: ImageCue[] = [
    { startSeconds: 0, endSeconds: 10, artworkId: "a", sectionLabel: "uno", editorialNote: "n1" },
    { startSeconds: 10, endSeconds: 20, artworkId: "b", sectionLabel: "dos", editorialNote: "n2" },
  ];
  const captions: CaptionCue[] = [
    { startSeconds: 8, endSeconds: 14, text: "sigue la voz", provenance: "automatic" },
  ];

  it("changes the image on the cue while the caption stays fully opaque", () => {
    const before = frameAt(cues, captions, 9.9, false);
    const after = frameAt(cues, captions, 10, false);
    expect(before.artworkId).toBe("a");
    expect(after.artworkId).toBe("b");
    expect(before.captionText).toBe(after.captionText);
    expect(before.captionOpacity).toBe(1);
    expect(after.captionOpacity).toBe(1);
    expect(artworkScale(0, false)).toBe(1);
    expect(artworkScale(1, false)).toBeCloseTo(1.03);
    expect(artworkScale(1, true)).toBe(1);
  });
});

describe("cached audio ranges", () => {
  it("slices a full file and rejects a range past the end", () => {
    expect(parseByteRange(null, 100)).toBe("full");
    expect(parseByteRange("bytes=0-9", 100)).toEqual({ start: 0, end: 9 });
    expect(parseByteRange("bytes=90-", 100)).toEqual({ start: 90, end: 99 });
    expect(parseByteRange("bytes=-10", 100)).toEqual({ start: 90, end: 99 });
    expect(parseByteRange("bytes=100-120", 100)).toBe("unsatisfiable");
  });
});
