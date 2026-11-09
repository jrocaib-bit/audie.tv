import type { CaptionCue, ImageCue } from "./catalog";

export type PresentationFrame = {
  artworkId: string | null;
  spanStart: number;
  spanEnd: number;
  spanProgress: number;
  sectionLabel: string | null;
  editorialNote: string | null;
  imageTransition: "cut" | "crossfade";
  captionText: string | null;
  captionOpacity: 0 | 1;
  captionProvenance: CaptionCue["provenance"] | null;
  captionReviewNote: string | null;
};

function cueIndexAt(cues: readonly ImageCue[], timeSeconds: number): number {
  const found = cues.findIndex((cue) => timeSeconds >= cue.startSeconds && timeSeconds < cue.endSeconds);
  if (found >= 0) return found;
  if (cues.length > 0 && timeSeconds >= cues[cues.length - 1].endSeconds - 1e-6) return cues.length - 1;
  return -1;
}

export function frameAt(
  cues: readonly ImageCue[],
  captions: readonly CaptionCue[],
  timeSeconds: number,
  reduceMotion: boolean,
): PresentationFrame {
  const index = cueIndexAt(cues, timeSeconds);
  const caption =
    captions.find((cue) => timeSeconds >= cue.startSeconds && timeSeconds < cue.endSeconds) ?? null;
  if (index < 0) {
    return {
      artworkId: null,
      spanStart: 0,
      spanEnd: 0,
      spanProgress: 0,
      sectionLabel: null,
      editorialNote: null,
      imageTransition: reduceMotion ? "cut" : "crossfade",
      captionText: caption?.text ?? null,
      captionOpacity: caption ? 1 : 0,
      captionProvenance: caption?.provenance ?? null,
      captionReviewNote: caption?.reviewNote ?? null,
    };
  }
  const current = cues[index];
  let spanStart = current.startSeconds;
  let spanEnd = current.endSeconds;
  for (let cursor = index - 1; cursor >= 0; cursor -= 1) {
    const sameWork = cues[cursor].artworkId === current.artworkId;
    const touches = Math.abs(cues[cursor].endSeconds - cues[cursor + 1].startSeconds) < 0.001;
    if (!sameWork || !touches) break;
    spanStart = cues[cursor].startSeconds;
  }
  for (let cursor = index + 1; cursor < cues.length; cursor += 1) {
    const sameWork = cues[cursor].artworkId === current.artworkId;
    const touches = Math.abs(cues[cursor - 1].endSeconds - cues[cursor].startSeconds) < 0.001;
    if (!sameWork || !touches) break;
    spanEnd = cues[cursor].endSeconds;
  }
  const span = Math.max(spanEnd - spanStart, 0.001);
  const spanProgress = Math.min(1, Math.max(0, (timeSeconds - spanStart) / span));
  return {
    artworkId: current.artworkId,
    spanStart,
    spanEnd,
    spanProgress,
    sectionLabel: current.sectionLabel,
    editorialNote: current.editorialNote,
    imageTransition: reduceMotion ? "cut" : "crossfade",
    captionText: caption?.text ?? null,
    captionOpacity: caption ? 1 : 0,
    captionProvenance: caption?.provenance ?? null,
    captionReviewNote: caption?.reviewNote ?? null,
  };
}
