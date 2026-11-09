export type Bilingual = { es: string; en: string };

export type LocaleCode = "es" | "en" | "it";

export type CatalogSegment = {
  id: string;
  publicPath: string;
  kitPath: string;
  sha256: string;
  startSeconds: number;
  durationSeconds: number;
  bytes: number;
};

export type Episode = {
  id: string;
  locale: LocaleCode;
  bookId: string;
  number: number;
  title: string;
  scriptureRangeLabel: string;
  status: "playable";
  durationSeconds: number;
  segments: CatalogSegment[];
  summary: Bilingual;
  titulo?: { es: string | null; en: string | null } | null;
  tituloCorto?: { es: string | null; en: string | null } | null;
  etiqueta?: { es: string | null; en: string | null } | null;
};

export type ArtworkCrop = {
  kind: "detail";
  pixels: [number, number, number, number];
  sourceWidth: number;
  sourceHeight: number;
  sourceSha256: string;
  transforms: string;
};

export type Artwork = {
  id: string;
  workId: string;
  title: Bilingual;
  artist: Bilingual;
  date: string;
  dateNote?: string;
  location: Bilingual;
  license: string;
  licenseUrl?: string;
  credit: string;
  creditRequirement: string;
  sourcePage: string;
  sourceFile: string;
  photographer?: string;
  photographDate?: string;
  publicPath: string;
  kitPath: string;
  sha256: string;
  bytes: number;
  width: number;
  height: number;
  crop: ArtworkCrop | null;
  editorialRole: string;
  displayable: true;
};

export type ImageCue = {
  startSeconds: number;
  endSeconds: number;
  artworkId: string;
  sectionLabel: string;
  editorialNote: string;
};

export type CaptionCue = {
  startSeconds: number;
  endSeconds: number;
  text: string;
  provenance: "automatic" | "reviewed_correction";
  reviewNote?: string;
};

export type Book = {
  id: string;
  testament: "ot" | "nt";
  order: number;
  name: Bilingual;
  status: "pilot" | "not_in_pilot";
  deuterocanonico?: boolean;
  capitulosTotal?: number | null;
};

export type PendingEpisode = {
  id: string;
  bookId: string;
  orden: number;
  capitulos: string | null;
  rango: string | null;
  titulo: { es: string | null; en: string | null };
  tituloCorto: { es: string | null; en: string | null };
  etiqueta: { es: string | null; en: string | null };
  propuesta: boolean;
  presentacion: "revision" | "preparacion";
};

export type AppCatalog = {
  actualizado: string;
  books: Book[];
  episodes: Episode[];
  pendientes: PendingEpisode[];
  artworks: Artwork[];
  cues: ImageCue[];
  captions: CaptionCue[];
  locales: Catalog["locales"];
  outlineNote: { es: string; en: string };
  fuenteTexto: { es: string | null; en: string | null };
  rangos: { id: string; bookId: string; orden: number; rango: string }[];
};

export type Catalog = {
  schemaVersion: "1.0.0";
  id: "audite-pilot";
  catalogStatus: "pilot";
  rights: {
    text: { status: "confirmed_by_owner"; confirmedBy: "Javier Roca"; scope: Bilingual };
    voice: { status: "confirmed_by_owner"; confirmedBy: "Javier Roca"; scope: Bilingual };
    images: { status: "reproduction_documented"; legalSignoff: false; note: Bilingual };
  };
  pilot: {
    episodeId: string;
    totalDurationSeconds: number;
    joinSeconds: number;
    joinReview: "clean";
    timelineStatus: "draft_editorial_sequence";
    timelineNote: Bilingual;
    captionReview: Bilingual;
  };
  locales: Array<{
    code: LocaleCode;
    label: Bilingual;
    playback: "pilot" | "not_attached";
    note: Bilingual;
  }>;
  canon: { order: "protestant-66-provisional"; note: Bilingual };
  books: Book[];
  genesisOutline: {
    approvedEpisodeCount: 10;
    incorporatedNumbers: number[];
    note: Bilingual;
  };
  episodes: Episode[];
  artworks: Artwork[];
  cues: ImageCue[];
  captions: CaptionCue[];
  referenceText: {
    episodeId: string;
    status: "supplied_pilot_reference";
    note: Bilingual;
    paragraphs: string[];
  };
};

export function playableEpisodes(catalog: { episodes: readonly Episode[] }): Episode[] {
  return catalog.episodes.filter(
    (episode) => episode.status === "playable" && episode.segments.length > 0 && episode.durationSeconds > 0,
  );
}

export function episodeById(catalog: { episodes: readonly Episode[] }, id: string): Episode | null {
  return catalog.episodes.find((episode) => episode.id === id) ?? null;
}

export function artworkById(catalog: { artworks: readonly Artwork[] }, id: string | null): Artwork | null {
  if (!id) return null;
  return catalog.artworks.find((artwork) => artwork.id === id) ?? null;
}

export function playableIds(catalog: { episodes: readonly Episode[] }): string[] {
  return playableEpisodes(catalog).map((episode) => episode.id);
}
