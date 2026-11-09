import { describe, expect, it } from "vitest";
import { dailyListening } from "./daily";
import { addToPath, emptyPath, moveStep, parsePath, removeFromPath, sanitizePath } from "./path";
import { JoinedPlayback, type AudioPort } from "./playback";
import { initialPlayerState, playerReducer } from "./player";
import { frameAt } from "./presentation";
import { emptyProgress, parseProgress, recordListen, resumePosition } from "./progress";
import { episodeDuration, rangeDiscontinuities, segmentAt, type MediaSegment } from "./segments";
import { parseSettings } from "./settings";
import { citaEnCurso, formatClock } from "./time";
import type { CaptionCue, ImageCue } from "./catalog";

const pilot: MediaSegment[] = [
  { id: "p1", url: "/a.mp3", startSeconds: 0, durationSeconds: 367.516688 },
  { id: "p2", url: "/b.mp3", startSeconds: 367.516688, durationSeconds: 130.533875 },
];

class FakePort implements AudioPort {
  src = "";
  currentTime = 0;
  playbackRate = 1;
  paused = true;
  preload = "none";
  plays = 0;
  play(): Promise<void> {
    this.paused = false;
    this.plays += 1;
    return Promise.resolve();
  }
  pause(): void {
    this.paused = true;
  }
}

const cues: ImageCue[] = [
  { startSeconds: 0, endSeconds: 151.52, artworkId: "A05", sectionLabel: "creación", editorialNote: "símbolo" },
  { startSeconds: 151.52, endSeconds: 208.08, artworkId: "A11", sectionLabel: "animales", editorialNote: "plano" },
  {
    startSeconds: 452.476688,
    endSeconds: 473.296688,
    artworkId: "A06d",
    sectionLabel: "letargo",
    editorialNote: "presentación, no costilla",
  },
  {
    startSeconds: 473.296688,
    endSeconds: 498.050563,
    artworkId: "A06d",
    sectionLabel: "unión",
    editorialNote: "asociación artística",
  },
];

const captions: CaptionCue[] = [
  { startSeconds: 0, endSeconds: 8.8, text: "Libro del Génesis.", provenance: "automatic" },
  {
    startSeconds: 112.64,
    endSeconds: 120.4,
    text: "para señalar las fiestas, los días y los años",
    provenance: "reviewed_correction",
    reviewNote: "falso positivo",
  },
];

describe("segments", () => {
  it("maps the join to the second file and keeps the total", () => {
    expect(episodeDuration(pilot)).toBeCloseTo(498.050563, 6);
    expect(segmentAt(pilot, 0)?.segment.id).toBe("p1");
    expect(segmentAt(pilot, 367.516687)?.segment.id).toBe("p1");
    const join = segmentAt(pilot, 367.516688);
    expect(join?.segment.id).toBe("p2");
    expect(join?.localSeconds).toBeCloseTo(0, 6);
    const end = segmentAt(pilot, 498.050563);
    expect(end?.segment.id).toBe("p2");
    expect(end?.localSeconds).toBeCloseTo(130.533875, 6);
    expect(segmentAt(pilot, -10)?.localSeconds).toBe(0);
    expect(segmentAt(pilot, 900)?.segment.id).toBe("p2");
  });

  it("flags gaps and overlaps", () => {
    expect(rangeDiscontinuities([{ start: 0, end: 10 }, { start: 10, end: 12 }])).toEqual([]);
    expect(rangeDiscontinuities([{ start: 0, end: 10 }, { start: 11, end: 12 }])).toHaveLength(1);
  });
});

describe("joined playback", () => {
  it("seeks across the join, changes speed, and advances when a file ends", () => {
    const first = new FakePort();
    const second = new FakePort();
    const engine = new JoinedPlayback([first, second]);
    engine.configure(pilot, 10, 1);
    expect(first.src).toBe("/a.mp3");
    expect(second.src).toBe("/b.mp3");
    expect(first.currentTime).toBe(10);
    expect(second.paused).toBe(true);

    engine.setRate(1.25);
    expect(first.playbackRate).toBe(1.25);
    expect(second.playbackRate).toBe(1.25);

    engine.seek(367.516688, true);
    expect(engine.activePortIndex()).toBe(1);
    expect(first.paused).toBe(true);
    expect(second.currentTime).toBe(0);
    expect(second.plays).toBe(1);

    first.currentTime = 367.516688;
    expect(engine.handleEnded(0)).toEqual({ kind: "ignored" });
    second.currentTime = 130.533875;
    expect(engine.handleEnded(1)).toEqual({ kind: "complete" });
  });

  it("starts the next file when the first one ends", () => {
    const first = new FakePort();
    const second = new FakePort();
    const engine = new JoinedPlayback([first, second]);
    engine.configure(pilot, 0, 1);
    expect(engine.handleEnded(0)).toEqual({ kind: "advanced", global: 367.516688 });
    expect(engine.activePortIndex()).toBe(1);
    expect(second.plays).toBe(1);
    expect(first.paused).toBe(true);
  });
});

describe("player state", () => {
  it("does not autoplay on load and remembers seek, pause, speed, and the end", () => {
    let state = playerReducer(initialPlayerState, {
      type: "load",
      episodeId: "es-genesis-01",
      duration: 498.050563,
      globalTime: 90,
      rate: 1,
    });
    expect(state.status).toBe("paused");
    expect(state.globalTime).toBe(90);
    state = playerReducer(state, { type: "play" });
    expect(state.status).toBe("playing");
    state = playerReducer(state, { type: "tick", globalTime: 95 });
    expect(state.globalTime).toBe(95);
    state = playerReducer(state, { type: "pause" });
    expect(playerReducer(state, { type: "tick", globalTime: 200 }).globalTime).toBe(95);
    state = playerReducer(state, { type: "set-rate", rate: 1.5 });
    expect(state.rate).toBe(1.5);
    state = playerReducer(state, { type: "seek", globalTime: 9999 });
    expect(state.globalTime).toBeCloseTo(498.050563, 5);
    state = playerReducer(state, { type: "ended" });
    expect(state.status).toBe("ended");
    state = playerReducer(state, { type: "play" });
    expect(state.status).toBe("playing");
    expect(state.globalTime).toBe(0);
    state = playerReducer(state, { type: "error", message: "no" });
    expect(playerReducer(state, { type: "play" }).status).toBe("error");
  });
});

describe("progress", () => {
  it("resumes a paused position and restarts a finished episode", () => {
    const duration = 498.050563;
    let progress = recordListen(emptyProgress(), "es-genesis-01", 120, duration, "paused", "t1");
    expect(resumePosition(progress.episodes["es-genesis-01"], duration)).toBe(120);
    progress = recordListen(progress, "es-genesis-01", duration, duration, "ended", "t2");
    expect(progress.episodes["es-genesis-01"].completed).toBe(true);
    expect(resumePosition(progress.episodes["es-genesis-01"], duration)).toBe(0);
    progress = recordListen(progress, "es-genesis-01", 40, duration, "paused", "t3");
    expect(progress.episodes["es-genesis-01"].completed).toBe(false);
    expect(resumePosition(progress.episodes["es-genesis-01"], duration)).toBe(40);
    const parsed = parseProgress({ episodes: { bad: { positionSeconds: "x" }, ok: { positionSeconds: 3, completed: false } } });
    expect(parsed.episodes.bad).toBeUndefined();
    expect(parsed.episodes.ok.positionSeconds).toBe(3);
  });
});

describe("path", () => {
  const available = ["es-genesis-01"];

  it("adds, reorders, and refuses anything that cannot be played", () => {
    const added = addToPath(emptyPath("t0"), "es-genesis-01", available, "t1");
    expect(added.ok).toBe(true);
    if (!added.ok) return;
    expect(addToPath(added.path, "es-genesis-01", available, "t2").ok).toBe(false);
    expect(addToPath(added.path, "es-genesis-02", available, "t2")).toMatchObject({ ok: false, reason: "unavailable" });
    const second = addToPath(added.path, "es-genesis-01b", ["es-genesis-01", "es-genesis-01b"], "t2");
    if (!second.ok) throw new Error("expected add");
    const moved = moveStep(second.path, 1, -1, "t3");
    expect(moved.ok && moved.path.steps.map((step) => step.episodeId)).toEqual(["es-genesis-01b", "es-genesis-01"]);
    const removed = removeFromPath(second.path, "es-genesis-01", "t4");
    expect(removed.ok && removed.path.steps).toEqual([{ episodeId: "es-genesis-01b" }]);
    const dirty = parsePath({ steps: [{ episodeId: "es-genesis-02" }, { episodeId: "es-genesis-01" }, { nope: true }] });
    expect(sanitizePath(dirty, available, "t5").steps).toEqual([{ episodeId: "es-genesis-01" }]);
  });
});

describe("daily listening", () => {
  it("follows the path and stops when the playable steps are finished", () => {
    const durations = { "es-genesis-01": 498 };
    expect(
      dailyListening({
        path: emptyPath(),
        progress: emptyProgress(),
        playableIds: ["es-genesis-01"],
        durations,
        plannedMinutes: 15,
      }).kind,
    ).toBe("empty_path");
    const path = addToPath(emptyPath(), "es-genesis-01", ["es-genesis-01"], "t");
    if (!path.ok) throw new Error("path");
    const progress = recordListen(emptyProgress(), "es-genesis-01", 80, 498, "paused", "t");
    expect(
      dailyListening({ path: path.path, progress, playableIds: ["es-genesis-01"], durations, plannedMinutes: 15 }),
    ).toMatchObject({ kind: "continue", episodeId: "es-genesis-01", resumeSeconds: 80 });
    const done = recordListen(progress, "es-genesis-01", 498, 498, "ended", "t2");
    expect(
      dailyListening({ path: path.path, progress: done, playableIds: ["es-genesis-01"], durations, plannedMinutes: 15 }).kind,
    ).toBe("path_complete");
    expect(
      dailyListening({
        path: path.path,
        progress: emptyProgress(),
        playableIds: [],
        durations,
        plannedMinutes: 15,
      }).kind,
    ).toBe("nothing_playable");
  });
});

describe("presentation", () => {
  it("keeps captions fully opaque and independent of the image transition", () => {
    const moving = frameAt(cues, captions, 116, false);
    const still = frameAt(cues, captions, 116, true);
    expect(moving.captionText).toContain("fiestas");
    expect(moving.captionOpacity).toBe(1);
    expect(still.captionOpacity).toBe(1);
    expect(moving.captionText).toBe(still.captionText);
    expect(moving.imageTransition).toBe("crossfade");
    expect(still.imageTransition).toBe("cut");
    expect(moving.artworkId).toBe("A05");
  });

  it("holds one image across adjacent cues and changes the note with the narration", () => {
    const early = frameAt(cues, captions, 460, false);
    const later = frameAt(cues, captions, 480, false);
    expect(early.artworkId).toBe("A06d");
    expect(later.artworkId).toBe("A06d");
    expect(early.spanStart).toBe(452.476688);
    expect(later.spanEnd).toBe(498.050563);
    expect(early.editorialNote).not.toBe(later.editorialNote);
    expect(early.spanProgress).toBeGreaterThan(0);
    expect(later.spanProgress).toBeGreaterThan(early.spanProgress);
  });

  it("returns no caption rather than a faded one in the gaps", () => {
    const frame = frameAt(cues, captions, 20, false);
    expect(frame.captionText).toBeNull();
    expect(frame.captionOpacity).toBe(0);
    expect(frame.artworkId).toBe("A05");
  });
});

describe("settings parsing", () => {
  it("drops corrupt values", () => {
    const settings = parseSettings({ theme: "neon", textScale: "xl", rate: 8, uiLocale: "en", captions: false });
    expect(settings.theme).toBe("dark");
    expect(settings.textScale).toBe("xl");
    expect(settings.rate).toBe(1);
    expect(settings.uiLocale).toBe("en");
    expect(settings.captions).toBe(false);
  });
});

describe("clock", () => {
  it("formats the pilot length", () => {
    expect(formatClock(498.050563)).toBe("8:18");
    expect(citaEnCurso("Génesis 1:1–2:25", 0)).toBe("1:1");
    expect(citaEnCurso("Génesis 1:1–2:25", 1)).toBe("2:25");
    expect(formatClock(367.516688)).toBe("6:07");
  });
});
