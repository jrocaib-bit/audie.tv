import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { canonBooks, type Catalog } from "@audite/domain";
import { manifestSchema } from "./schema";
import { parseCueCsv, parseSrt } from "./srt";

type KitAsset = {
  title_es: string;
  title_en: string;
  artist_es: string;
  artist_en: string;
  date: string;
  date_note?: string;
  location_es: string;
  location_en: string;
  license: string;
  license_url?: string;
  source_page: string;
  source_file: string;
  credit: string;
  credit_requirement: string;
  role: string;
  asset_id: string;
  work_id: string;
  file: string;
  dimensions: [number, number];
  sha256: string;
  bytes: number;
  crop_pixels?: number[];
  source_dimensions?: [number, number];
  source_sha256?: string;
  transforms?: string;
  photographer?: string;
  photograph_date?: string;
};

type KitManifest = {
  timeline_seconds: number;
  p2_global_start_seconds: number;
  audio_inputs: Array<{ file: string; sha256: string; duration_seconds: number }>;
  assets: KitAsset[];
};

const REVIEWED_CAPTION = {
  startSeconds: 112.64,
  from: "las días",
  to: "las fiestas, los días",
  reviewNote:
    "Revisión audiovisual de Javier Roca: la alarma cerca de 1:52 fue un falso positivo. Esas palabras sí están en la narración, y solo este rótulo se corrigió.",
};

function readKit(root: string): { kit: KitManifest; cues: string; srt: string; reference: string } {
  const pilot = path.join(root, "content/pilot");
  const required = [
    "documentos/manifest_assets_v2.json",
    "documentos/guion_montaje_v2.csv",
    "documentos/transcripcion_automatica_ES.srt",
    "documentos/texto_ES_Drive_referencia.md",
  ];
  const missing = required.filter((relative) => !existsSync(path.join(pilot, relative)));
  if (missing.length > 0) {
    throw new Error(
      `Private pilot kit is not in this tree (${missing.join(", ")}). Audio, artwork, and the reference text stay out of the public repository.`,
    );
  }
  return {
    kit: JSON.parse(readFileSync(path.join(pilot, "documentos/manifest_assets_v2.json"), "utf8")) as KitManifest,
    cues: readFileSync(path.join(pilot, "documentos/guion_montaje_v2.csv"), "utf8"),
    srt: readFileSync(path.join(pilot, "documentos/transcripcion_automatica_ES.srt"), "utf8"),
    reference: readFileSync(path.join(pilot, "documentos/texto_ES_Drive_referencia.md"), "utf8"),
  };
}

function referenceParagraphs(markdown: string): string[] {
  return markdown
    .replace(/\\([!.])/g, "$1")
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/)
    .map((block) => block.replace(/\s+/g, " ").trim())
    .filter((block) => block.length > 0 && !block.startsWith("#"));
}

function artworkFromKit(asset: KitAsset): Catalog["artworks"][number] {
  const fileName = path.posix.basename(asset.file);
  const crop =
    asset.crop_pixels == null
      ? null
      : {
          kind: "detail" as const,
          pixels: asset.crop_pixels as [number, number, number, number],
          sourceWidth: asset.source_dimensions?.[0] ?? 0,
          sourceHeight: asset.source_dimensions?.[1] ?? 0,
          sourceSha256: asset.source_sha256 ?? "",
          transforms: asset.transforms ?? "",
        };
  return {
    id: asset.asset_id,
    workId: asset.work_id,
    title: { es: asset.title_es, en: asset.title_en },
    artist: { es: asset.artist_es, en: asset.artist_en },
    date: asset.date,
    ...(asset.date_note ? { dateNote: asset.date_note } : {}),
    location: { es: asset.location_es, en: asset.location_en },
    license: asset.license,
    ...(asset.license_url ? { licenseUrl: asset.license_url } : {}),
    credit: asset.credit,
    creditRequirement: asset.credit_requirement,
    sourcePage: asset.source_page,
    sourceFile: asset.source_file,
    ...(asset.photographer ? { photographer: asset.photographer } : {}),
    ...(asset.photograph_date ? { photographDate: asset.photograph_date } : {}),
    publicPath: `/media/art/${fileName}`,
    kitPath: `content/pilot/${asset.file}`,
    sha256: asset.sha256,
    bytes: asset.bytes,
    width: asset.dimensions[0],
    height: asset.dimensions[1],
    crop,
    editorialRole: asset.role,
    displayable: true,
  };
}

function fileBytes(root: string, kitRelative: string): number {
  return statSync(path.join(root, "content/pilot", kitRelative)).size;
}

export function buildPublicCatalog(root: string): Catalog {
  const { kit, cues, srt, reference } = readKit(root);
  if (kit.audio_inputs.length !== 2) throw new Error("The pilot expects exactly two Spanish audio files.");
  const [first, second] = kit.audio_inputs;
  if (Math.abs(second.duration_seconds + first.duration_seconds - kit.timeline_seconds) > 0.001) {
    throw new Error("Pilot audio durations do not add up to the timeline.");
  }
  if (Math.abs(first.duration_seconds - kit.p2_global_start_seconds) > 0.001) {
    throw new Error("The second file does not start where the first one ends.");
  }

  const artworks = kit.assets.map(artworkFromKit);
  const knownArt = new Set(artworks.map((artwork) => artwork.id));
  const imageCues = parseCueCsv(cues).map((row) => {
    if (!knownArt.has(row.assetId)) throw new Error(`Cue names an artwork that is not in the kit: ${row.assetId}`);
    return {
      startSeconds: row.startSeconds,
      endSeconds: row.endSeconds,
      artworkId: row.assetId,
      sectionLabel: row.sectionLabel,
      editorialNote: row.editorialNote,
    };
  });

  let corrections = 0;
  const captions = parseSrt(srt).map((cue) => {
    const matchesReview =
      Math.abs(cue.startSeconds - REVIEWED_CAPTION.startSeconds) < 0.05 && cue.text.includes(REVIEWED_CAPTION.from);
    if (!matchesReview) return { ...cue, provenance: "automatic" as const };
    corrections += 1;
    return {
      ...cue,
      text: cue.text.replace(REVIEWED_CAPTION.from, REVIEWED_CAPTION.to),
      provenance: "reviewed_correction" as const,
      reviewNote: REVIEWED_CAPTION.reviewNote,
    };
  });
  if (corrections !== 1) throw new Error(`Expected one reviewed caption correction, found ${corrections}.`);

  const paragraphs = referenceParagraphs(reference);
  if (paragraphs.length < 2) {
    throw new Error("The reference text did not contain the expected paragraphs.");
  }

  const catalog = {
    schemaVersion: "1.0.0" as const,
    id: "audite-pilot" as const,
    catalogStatus: "pilot" as const,
    rights: {
      text: {
        status: "confirmed_by_owner" as const,
        confirmedBy: "Javier Roca" as const,
        scope: {
          es: "Texto en español del piloto de Génesis 1–2, confirmado por Javier Roca.",
          en: "Spanish text of the Genesis 1–2 pilot, confirmed by Javier Roca.",
        },
      },
      voice: {
        status: "confirmed_by_owner" as const,
        confirmedBy: "Javier Roca" as const,
        scope: {
          es: "Voz en español del piloto de Génesis 1–2, confirmada por Javier Roca.",
          en: "Spanish voice of the Genesis 1–2 pilot, confirmed by Javier Roca.",
        },
      },
      images: {
        status: "reproduction_documented" as const,
        legalSignoff: false as const,
        note: {
          es: "Las reproducciones están documentadas como PD-Art o CC0, con ficha y archivo de origen. Eso no es un dictamen jurídico, ni un aval del museo, ni una autorización para todo territorio.",
          en: "The reproductions are documented as PD-Art or CC0, with a source page and file. That is not a legal opinion, a museum endorsement, or permission for every territory.",
        },
      },
    },
    pilot: {
      episodeId: "es-genesis-01",
      totalDurationSeconds: kit.timeline_seconds,
      joinSeconds: kit.p2_global_start_seconds,
      joinReview: "clean" as const,
      timelineStatus: "draft_editorial_sequence" as const,
      timelineNote: {
        es: "La secuencia de imágenes es una propuesta editorial. Los cortes salen de una transcripción automática y no prueban que cada cambio sea el mejor. Durante la formación de Eva, el cuadro presenta a Eva: no representa la extracción de la costilla.",
        en: "The image sequence is an editorial proposal. The cuts come from an automatic transcript and are not proof that every change is best. While Eve is formed, the painting presents Eve: it does not depict the taking of the rib.",
      },
      captionReview: {
        es: "Cerca de 1:52, una alarma de desajuste fue un falso positivo: las palabras sí están en la narración. El rótulo automático se corrigió solo en ese tramo.",
        en: "Near 1:52, a mismatch alarm was a false positive: the words are in the narration. The automatic caption was corrected only in that span.",
      },
    },
    locales: [
      {
        code: "es" as const,
        label: { es: "Español", en: "Spanish" },
        playback: "pilot" as const,
        note: {
          es: "Idioma del piloto. El episodio 1 de Génesis se puede oír.",
          en: "Language of the pilot. Genesis episode 1 can be played.",
        },
      },
      {
        code: "en" as const,
        label: { es: "Inglés", en: "English" },
        playback: "not_attached" as const,
        note: {
          es: "No hay audio en inglés en este kit. No se ofrece como reproducible.",
          en: "No English audio is in this kit. It is not offered as playable.",
        },
      },
      {
        code: "it" as const,
        label: { es: "Italiano", en: "Italian" },
        playback: "not_attached" as const,
        note: {
          es: "No hay audio en italiano en este kit. No se ofrece como reproducible.",
          en: "No Italian audio is in this kit. It is not offered as playable.",
        },
      },
    ],
    canon: {
      order: "protestant-66-provisional" as const,
      note: {
        es: "Orden provisional de 66 libros, para situar el camino. El canon definitivo no está cerrado en este borrador.",
        en: "Provisional 66-book order, so the path has a horizon. The final canon is not settled in this draft.",
      },
    },
    books: canonBooks(),
    genesisOutline: {
      approvedEpisodeCount: 10 as const,
      incorporatedNumbers: [1],
      note: {
        es: "El esquema de diez episodios de Génesis consta como aprobado. Este borrador solo incorpora el episodio 1. Los episodios 2 a 10 no traen título, texto ni audio, y no son fichas reproducibles.",
        en: "A ten-episode Genesis outline is recorded as approved. This draft includes only episode 1. Episodes 2–10 bring no title, text, or audio, and they are not playable records.",
      },
    },
    episodes: [
      {
        id: "es-genesis-01",
        locale: "es" as const,
        bookId: "genesis",
        number: 1,
        title: "En el principio. La creación y el hombre.",
        scriptureRangeLabel: "Génesis 1–2",
        status: "playable" as const,
        durationSeconds: kit.timeline_seconds,
        segments: [
          {
            id: "es-genesis-01-p1",
            publicPath: `/media/audio/${path.posix.basename(first.file)}`,
            kitPath: `content/pilot/${first.file}`,
            sha256: first.sha256,
            startSeconds: 0,
            durationSeconds: first.duration_seconds,
            bytes: fileBytes(root, first.file),
          },
          {
            id: "es-genesis-01-p2",
            publicPath: `/media/audio/${path.posix.basename(second.file)}`,
            kitPath: `content/pilot/${second.file}`,
            sha256: second.sha256,
            startSeconds: kit.p2_global_start_seconds,
            durationSeconds: second.duration_seconds,
            bytes: fileBytes(root, second.file),
          },
        ],
        summary: {
          es: "Génesis 1–2 en una sola narración española. Dos archivos se oyen seguidos, con la unión en 6:07.",
          en: "Genesis 1–2 as one Spanish narration. Two files play in sequence, joining at 6:07.",
        },
      },
    ],
    artworks,
    cues: imageCues,
    captions,
    referenceText: {
      episodeId: "es-genesis-01",
      status: "supplied_pilot_reference" as const,
      note: {
        es: "Texto de referencia incluido con el piloto. Esta ficha no lo presenta como edición crítica certificada. Puede no coincidir palabra por palabra con la transcripción automática.",
        en: "Reference text supplied with the pilot. This record does not present it as a certified critical edition. It may differ word for word from the automatic transcript.",
      },
      paragraphs,
    },
  };

  return manifestSchema.parse(catalog);
}

export const FORBIDDEN_PUBLIC_FRAGMENTS = [
  "source_box_path",
  "human_legal_signoff",
  "validacion_kit",
  "contacto_seleccion",
  "contacto_nuevas",
  "audite-auditoria",
  "bosch_vista_completa",
  "cotejos",
  "descargas_y_cotejos",
  "fuentes_y_extractos",
  "/workspace/audite",
  "publication_blockers",
  "Whisper",
];
