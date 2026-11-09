import { z } from "zod";

const bilingual = z.object({ es: z.string().min(1), en: z.string().min(1) }).strict();
const sha256 = z.string().regex(/^[a-f0-9]{64}$/);
const publicPath = z.string().regex(/^\/media\/(audio|art)\/[A-Za-z0-9._-]+$/);
const kitPath = z.string().regex(/^content\/pilot\/(audio|assets)\/[A-Za-z0-9._-]+$/);

const segmentSchema = z
  .object({
    id: z.string().min(1),
    publicPath,
    kitPath,
    sha256,
    startSeconds: z.number().nonnegative(),
    durationSeconds: z.number().positive(),
    bytes: z.number().int().positive(),
  })
  .strict();

const cropSchema = z
  .object({
    kind: z.literal("detail"),
    pixels: z.tuple([z.number(), z.number(), z.number(), z.number()]),
    sourceWidth: z.number().positive(),
    sourceHeight: z.number().positive(),
    sourceSha256: sha256,
    transforms: z.string().min(1),
  })
  .strict();

export const artworkSchema = z
  .object({
    id: z.string().min(1),
    workId: z.string().min(1),
    title: bilingual,
    artist: bilingual,
    date: z.string().min(1),
    dateNote: z.string().min(1).optional(),
    location: bilingual,
    license: z.string().min(1),
    licenseUrl: z.string().url().optional(),
    credit: z.string().min(1),
    creditRequirement: z.string().min(1),
    sourcePage: z.string().url(),
    sourceFile: z.string().url(),
    photographer: z.string().min(1).optional(),
    photographDate: z.string().min(1).optional(),
    publicPath,
    kitPath,
    sha256,
    bytes: z.number().int().positive(),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    crop: cropSchema.nullable(),
    editorialRole: z.string().min(1),
    displayable: z.literal(true),
  })
  .strict();

export const manifestSchema = z
  .object({
    schemaVersion: z.literal("1.0.0"),
    id: z.literal("audite-pilot"),
    catalogStatus: z.literal("pilot"),
    rights: z
      .object({
        text: z
          .object({
            status: z.literal("confirmed_by_owner"),
            confirmedBy: z.literal("Javier Roca"),
            scope: bilingual,
          })
          .strict(),
        voice: z
          .object({
            status: z.literal("confirmed_by_owner"),
            confirmedBy: z.literal("Javier Roca"),
            scope: bilingual,
          })
          .strict(),
        images: z
          .object({
            status: z.literal("reproduction_documented"),
            legalSignoff: z.literal(false),
            note: bilingual,
          })
          .strict(),
      })
      .strict(),
    pilot: z
      .object({
        episodeId: z.string().min(1),
        totalDurationSeconds: z.number().positive(),
        joinSeconds: z.number().positive(),
        joinReview: z.literal("clean"),
        timelineStatus: z.literal("draft_editorial_sequence"),
        timelineNote: bilingual,
        captionReview: bilingual,
      })
      .strict(),
    locales: z.array(
      z
        .object({
          code: z.enum(["es", "en", "it"]),
          label: bilingual,
          playback: z.enum(["pilot", "not_attached"]),
          note: bilingual,
        })
        .strict(),
    ),
    canon: z.object({ order: z.literal("protestant-66-provisional"), note: bilingual }).strict(),
    books: z.array(
      z
        .object({
          id: z.string().min(1),
          testament: z.enum(["ot", "nt"]),
          order: z.number().int().positive(),
          name: bilingual,
          status: z.enum(["pilot", "not_in_pilot"]),
        })
        .strict(),
    ),
    genesisOutline: z
      .object({
        approvedEpisodeCount: z.literal(10),
        incorporatedNumbers: z.array(z.number().int().positive()),
        note: bilingual,
      })
      .strict(),
    episodes: z.array(
      z
        .object({
          id: z.string().min(1),
          locale: z.enum(["es", "en", "it"]),
          bookId: z.string().min(1),
          number: z.number().int().positive(),
          title: z.string().min(1),
          scriptureRangeLabel: z.string().min(1),
          status: z.literal("playable"),
          durationSeconds: z.number().positive(),
          segments: z.array(segmentSchema).min(1),
          summary: bilingual,
        })
        .strict(),
    ),
    artworks: z.array(artworkSchema).min(1),
    cues: z.array(
      z
        .object({
          startSeconds: z.number().nonnegative(),
          endSeconds: z.number().positive(),
          artworkId: z.string().min(1),
          sectionLabel: z.string().min(1),
          editorialNote: z.string().min(1),
        })
        .strict(),
    ),
    captions: z.array(
      z
        .object({
          startSeconds: z.number().nonnegative(),
          endSeconds: z.number().positive(),
          text: z.string().min(1),
          provenance: z.enum(["automatic", "reviewed_correction"]),
          reviewNote: z.string().min(1).optional(),
        })
        .strict(),
    ),
    referenceText: z
      .object({
        episodeId: z.string().min(1),
        status: z.literal("supplied_pilot_reference"),
        note: bilingual,
        paragraphs: z.array(z.string().min(1)).min(1),
      })
      .strict(),
  })
  .strict();

export type Manifest = z.infer<typeof manifestSchema>;
