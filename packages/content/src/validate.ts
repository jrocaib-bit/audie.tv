import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { rangeDiscontinuities, type Catalog } from "@audite/domain";
import { FORBIDDEN_PUBLIC_FRAGMENTS, buildPublicCatalog } from "./build-catalog";
import { manifestSchema } from "./schema";

export type ValidationIssue = {
  severity: "error" | "warning";
  code: string;
  message: string;
};

export type ValidationReport = {
  ok: boolean;
  issues: ValidationIssue[];
};

const DURATION_TOLERANCE = 0.1;

export type FileProbe = {
  readFile: (kitPath: string) => Buffer | null;
  byteLength: (kitPath: string) => number | null;
  durationSeconds: (kitPath: string) => number | null;
};

function issue(severity: ValidationIssue["severity"], code: string, message: string): ValidationIssue {
  return { severity, code, message };
}

export function validateCatalog(catalogInput: unknown, files: FileProbe): ValidationReport {
  const issues: ValidationIssue[] = [];
  const parsed = manifestSchema.safeParse(catalogInput);
  if (!parsed.success) {
    return {
      ok: false,
      issues: parsed.error.issues.slice(0, 12).map((item) => issue("error", "schema", `${item.path.join(".")}: ${item.message}`)),
    };
  }
  const catalog: Catalog = parsed.data;
  const serialized = JSON.stringify(catalog);
  for (const fragment of FORBIDDEN_PUBLIC_FRAGMENTS) {
    if (serialized.includes(fragment)) {
      issues.push(issue("error", "private_material", `Public catalog contains ${fragment}.`));
    }
  }
  if (catalog.rights.images.legalSignoff === false) {
    issues.push(
      issue(
        "warning",
        "image_legal_signoff_absent",
        "Image reproductions are documented, and a separate legal sign-off is still absent.",
      ),
    );
  }
  if (catalog.pilot.timelineStatus === "draft_editorial_sequence") {
    issues.push(issue("warning", "timeline_is_draft", "Image timing is an editorial draft, not a final lock."));
  }
  if (catalog.rights.text.status !== "confirmed_by_owner" || catalog.rights.voice.status !== "confirmed_by_owner") {
    issues.push(issue("error", "missing_text_or_voice_rights", "Playable audio requires confirmed text and voice rights."));
  }

  const playableLocales = new Set(catalog.locales.filter((locale) => locale.playback === "pilot").map((locale) => locale.code));
  for (const locale of catalog.locales) {
    if (locale.code !== "es" && locale.playback !== "not_attached") {
      issues.push(issue("error", "locale_not_validated", `${locale.code} is marked playable without a validated attachment.`));
    }
  }
  if (catalog.episodes.length === 0) issues.push(issue("error", "missing_audio", "The catalog has no episodes."));
  for (const episode of catalog.episodes) {
    if (!playableLocales.has(episode.locale)) {
      issues.push(issue("error", "locale_not_validated", `${episode.id} is playable in ${episode.locale}, which is not a pilot locale.`));
    }
    if (Math.abs(episode.durationSeconds - catalog.pilot.totalDurationSeconds) > 0.001 && episode.id === catalog.pilot.episodeId) {
      issues.push(issue("error", "duration_mismatch", `${episode.id} does not match the pilot duration.`));
    }
    const segmentIssues = rangeDiscontinuities(
      episode.segments.map((segment) => ({ start: segment.startSeconds, end: segment.startSeconds + segment.durationSeconds })),
    );
    for (const message of segmentIssues) issues.push(issue("error", "duration_mismatch", `${episode.id}: ${message}`));
    const summed = episode.segments.reduce((end, segment) => Math.max(end, segment.startSeconds + segment.durationSeconds), 0);
    if (Math.abs(summed - episode.durationSeconds) > 0.001) {
      issues.push(issue("error", "duration_mismatch", `${episode.id} duration does not match its files.`));
    }
    for (const segment of episode.segments) {
      const bytes = files.readFile(segment.kitPath);
      if (!bytes) {
        issues.push(issue("error", "missing_audio", `${segment.kitPath} is not on disk.`));
        continue;
      }
      const hash = createHash("sha256").update(bytes).digest("hex");
      if (hash !== segment.sha256) issues.push(issue("error", "checksum_mismatch", `${segment.kitPath} checksum does not match.`));
      const size = files.byteLength(segment.kitPath);
      if (size != null && size !== segment.bytes) issues.push(issue("error", "checksum_mismatch", `${segment.kitPath} size does not match.`));
      if (segment.kitPath.endsWith(".mp3")) {
        const duration = files.durationSeconds(segment.kitPath);
        if (duration == null) issues.push(issue("error", "duration_mismatch", `${segment.kitPath} duration could not be read.`));
        else if (Math.abs(duration - segment.durationSeconds) > DURATION_TOLERANCE) {
          issues.push(
            issue("error", "duration_mismatch", `${segment.kitPath} is ${duration}s, catalog says ${segment.durationSeconds}s.`),
          );
        }
      }
    }
  }

  const artworkIds = new Set(catalog.artworks.map((artwork) => artwork.id));
  for (const artwork of catalog.artworks) {
    if (!artwork.license || !artwork.credit || !artwork.sourcePage) {
      issues.push(issue("error", "missing_image_rights", `${artwork.id} is missing license, credit, or source.`));
    }
    if (artwork.crop && artwork.crop.kind !== "detail") {
      issues.push(issue("error", "missing_image_rights", `${artwork.id} crop must be marked as a detail.`));
    }
    const bytes = files.readFile(artwork.kitPath);
    if (!bytes) {
      issues.push(issue("error", "missing_image", `${artwork.kitPath} is not on disk.`));
      continue;
    }
    const hash = createHash("sha256").update(bytes).digest("hex");
    if (hash !== artwork.sha256) issues.push(issue("error", "checksum_mismatch", `${artwork.kitPath} checksum does not match.`));
    const size = files.byteLength(artwork.kitPath);
    if (size != null && size !== artwork.bytes) issues.push(issue("error", "checksum_mismatch", `${artwork.kitPath} size does not match.`));
  }

  const cueIssues = rangeDiscontinuities(catalog.cues.map((cue) => ({ start: cue.startSeconds, end: cue.endSeconds })));
  for (const message of cueIssues) issues.push(issue("error", "timeline_gap", message));
  const cueEnd = catalog.cues.reduce((end, cue) => Math.max(end, cue.endSeconds), 0);
  if (Math.abs(cueEnd - catalog.pilot.totalDurationSeconds) > 0.001) {
    issues.push(issue("error", "timeline_gap", "Image cues do not cover the pilot duration."));
  }
  for (const cue of catalog.cues) {
    if (!artworkIds.has(cue.artworkId)) issues.push(issue("error", "missing_image", `Cue points at unknown artwork ${cue.artworkId}.`));
  }

  const orderedCaptions = [...catalog.captions].sort((a, b) => a.startSeconds - b.startSeconds);
  for (let index = 1; index < orderedCaptions.length; index += 1) {
    if (orderedCaptions[index].startSeconds < orderedCaptions[index - 1].endSeconds - 0.001) {
      issues.push(issue("error", "caption_overlap", `Captions overlap at ${orderedCaptions[index].startSeconds}s.`));
    }
  }
  const reviewed = catalog.captions.filter((caption) => caption.provenance === "reviewed_correction");
  if (reviewed.length !== 1 || !reviewed[0]?.text.includes("fiestas")) {
    issues.push(issue("error", "caption_review_missing", "The reviewed 1:52 caption correction is missing."));
  }
  for (const caption of catalog.captions) {
    if (caption.endSeconds > catalog.pilot.totalDurationSeconds + 0.05) {
      issues.push(issue("error", "caption_out_of_range", "A caption runs past the audio."));
    }
  }

  const spanish = catalog.locales.find((locale) => locale.code === "es");
  const english = catalog.locales.find((locale) => locale.code === "en");
  const italian = catalog.locales.find((locale) => locale.code === "it");
  if (spanish?.playback !== "pilot" || english?.playback !== "not_attached" || italian?.playback !== "not_attached") {
    issues.push(issue("error", "locale_coverage", "Expected Spanish pilot coverage and English/Italian unattached."));
  }
  if (catalog.books.filter((book) => book.status === "pilot").map((book) => book.id).join() !== "genesis") {
    issues.push(issue("error", "locale_coverage", "Only Genesis is in the pilot."));
  }
  if (catalog.books.length !== 66) issues.push(issue("error", "locale_coverage", "The provisional canon should list 66 books."));
  if (!catalog.genesisOutline.incorporatedNumbers.includes(1) || catalog.genesisOutline.incorporatedNumbers.length !== 1) {
    issues.push(issue("error", "outline_overclaimed", "The outline may incorporate only episode 1."));
  }

  return { ok: issues.every((item) => item.severity !== "error"), issues };
}

export function probeDurationSeconds(absolutePath: string): number | null {
  const result = spawnSync(
    "ffprobe",
    ["-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", absolutePath],
    { encoding: "utf8" },
  );
  if (result.status !== 0) return null;
  const duration = Number(result.stdout.trim());
  return Number.isFinite(duration) ? duration : null;
}

export function repositoryProbe(root: string): FileProbe {
  const absolute = (kitPath: string) => path.resolve(root, kitPath);
  return {
    readFile(kitPath) {
      const full = absolute(kitPath);
      if (!full.startsWith(path.resolve(root) + path.sep) || !existsSync(full)) return null;
      return readFileSync(full);
    },
    byteLength(kitPath) {
      const full = absolute(kitPath);
      if (!existsSync(full)) return null;
      return statSync(full).size;
    },
    durationSeconds(kitPath) {
      const full = absolute(kitPath);
      if (!existsSync(full)) return null;
      return probeDurationSeconds(full);
    },
  };
}

export function validateRepository(root: string): ValidationReport {
  const built = buildPublicCatalog(root);
  const onDisk = path.join(root, "content/catalog/manifest.json");
  if (!existsSync(onDisk)) {
    return { ok: false, issues: [issue("error", "catalog_missing", "content/catalog/manifest.json has not been written.")] };
  }
  const committed = JSON.parse(readFileSync(onDisk, "utf8")) as unknown;
  if (JSON.stringify(committed) !== JSON.stringify(built)) {
    return {
      ok: false,
      issues: [issue("error", "catalog_stale", "content/catalog/manifest.json does not match the kit. Run the catalog writer.")],
    };
  }
  return validateCatalog(committed, repositoryProbe(root));
}
