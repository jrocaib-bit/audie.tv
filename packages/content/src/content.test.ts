import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { canonBooks } from "@audite/domain";
import { buildPublicCatalog, FORBIDDEN_PUBLIC_FRAGMENTS } from "./build-catalog";
import { resolvePilotFile } from "./media-path";
import { manifestSchema } from "./schema";
import { parseSrt } from "./srt";
import { validateCatalog, validateRepository, type FileProbe } from "./validate";

const root = path.resolve(import.meta.dirname, "../../..");
const HASH = "a".repeat(64);

function sampleCatalog() {
  return manifestSchema.parse({
    schemaVersion: "1.0.0",
    id: "audite-pilot",
    catalogStatus: "pilot",
    rights: {
      text: {
        status: "confirmed_by_owner",
        confirmedBy: "Javier Roca",
        scope: { es: "Texto de prueba.", en: "Sample text." },
      },
      voice: {
        status: "confirmed_by_owner",
        confirmedBy: "Javier Roca",
        scope: { es: "Voz de prueba.", en: "Sample voice." },
      },
      images: {
        status: "reproduction_documented",
        legalSignoff: false,
        note: { es: "Sin dictamen.", en: "No legal opinion." },
      },
    },
    pilot: {
      episodeId: "es-genesis-01",
      totalDurationSeconds: 10,
      joinSeconds: 10,
      joinReview: "clean",
      timelineStatus: "draft_editorial_sequence",
      timelineNote: { es: "Borrador.", en: "Draft." },
      captionReview: { es: "Una corrección.", en: "One correction." },
    },
    locales: [
      { code: "es", label: { es: "Español", en: "Spanish" }, playback: "pilot", note: { es: "Prueba.", en: "Sample." } },
      { code: "en", label: { es: "Inglés", en: "English" }, playback: "not_attached", note: { es: "No.", en: "No." } },
      { code: "it", label: { es: "Italiano", en: "Italian" }, playback: "not_attached", note: { es: "No.", en: "No." } },
    ],
    canon: { order: "protestant-66-provisional", note: { es: "Orden de prueba.", en: "Sample order." } },
    books: canonBooks(),
    genesisOutline: {
      approvedEpisodeCount: 10,
      incorporatedNumbers: [1],
      note: { es: "Solo el episodio 1.", en: "Episode 1 only." },
    },
    episodes: [
      {
        id: "es-genesis-01",
        locale: "es",
        bookId: "genesis",
        number: 1,
        title: "Episodio de prueba",
        scriptureRangeLabel: "Prueba 1",
        status: "playable",
        durationSeconds: 10,
        segments: [
          {
            id: "p1",
            publicPath: "/media/audio/pieza.mp3",
            kitPath: "content/pilot/audio/pieza.mp3",
            sha256: HASH,
            startSeconds: 0,
            durationSeconds: 10,
            bytes: 4,
          },
        ],
        summary: { es: "Resumen de prueba.", en: "Sample summary." },
      },
    ],
    artworks: [
      {
        id: "obra",
        workId: "obra",
        title: { es: "Obra de prueba", en: "Sample work" },
        artist: { es: "Anónimo", en: "Anonymous" },
        date: "2020",
        location: { es: "Taller", en: "Studio" },
        license: "CC0",
        credit: "Prueba",
        creditRequirement: "Ninguno",
        sourcePage: "https://example.com/obra",
        sourceFile: "https://example.com/obra.jpg",
        publicPath: "/media/art/obra.jpg",
        kitPath: "content/pilot/assets/obra.jpg",
        sha256: HASH,
        bytes: 4,
        width: 10,
        height: 10,
        crop: null,
        editorialRole: "Prueba",
        displayable: true,
      },
    ],
    cues: [
      {
        startSeconds: 0,
        endSeconds: 10,
        artworkId: "obra",
        sectionLabel: "Apertura",
        editorialNote: "Nota de prueba",
      },
    ],
    captions: [
      {
        startSeconds: 0,
        endSeconds: 4,
        text: "Rótulo revisado de fiestas",
        provenance: "reviewed_correction",
        reviewNote: "Corrección de prueba. No es texto bíblico.",
      },
    ],
    referenceText: {
      episodeId: "es-genesis-01",
      status: "supplied_pilot_reference",
      note: { es: "Nota.", en: "Note." },
      paragraphs: ["Párrafo de prueba del banco de tests."],
    },
  });
}

describe("public catalog", () => {
  it("keeps the private pilot kit out of this tree", () => {
    expect(existsSync(path.join(root, "content/pilot/documentos/texto_ES_Drive_referencia.md"))).toBe(false);
    expect(existsSync(path.join(root, "content/pilot/documentos/transcripcion_automatica_ES.srt"))).toBe(false);
    expect(existsSync(path.join(root, "content/pilot/audio/ES_p1_original.mp3"))).toBe(false);
    expect(existsSync(path.join(root, "content/demo/05_audio/masters/gn-01_es_master_v1.mp3"))).toBe(false);
    expect(existsSync(path.join(root, "content/demo/catalogo-app.json"))).toBe(false);
    expect(() => buildPublicCatalog(root)).toThrow(/public repository/);
    const committed = readFileSync(path.join(root, "content/catalog/manifest.json"), "utf8");
    expect(committed).not.toContain("Al principio creó Dios");
    expect(committed).not.toContain("informe y vacía");
    for (const fragment of FORBIDDEN_PUBLIC_FRAGMENTS) expect(committed).not.toContain(fragment);
    const parsed = manifestSchema.parse(JSON.parse(committed));
    expect(parsed.referenceText.paragraphs).toEqual([
      "El texto de referencia del piloto no está en este repositorio público.",
    ]);
    expect(parsed.captions).toEqual([]);
  });

  it("does not treat the public tree as a playable kit", () => {
    expect(() => validateRepository(root)).toThrow(/public repository/);
  });
});

describe("validation gates", () => {
  it("rejects a checksum mismatch, a missing file, and a duration drift", () => {
    const catalog = sampleCatalog();
    const segment = catalog.episodes[0]?.segments[0];
    if (!segment) throw new Error("missing segment");
    const probe: FileProbe = {
      readFile: () => Buffer.from("not-the-audio"),
      byteLength: () => 1,
      durationSeconds: () => segment.durationSeconds + 2,
    };
    const report = validateCatalog(catalog, probe);
    expect(report.ok).toBe(false);
    expect(report.issues.map((item) => item.code)).toEqual(expect.arrayContaining(["checksum_mismatch", "duration_mismatch"]));

    const missing = validateCatalog(catalog, {
      readFile: (kitPath) => (kitPath.endsWith(".mp3") ? null : Buffer.from("x")),
      byteLength: () => 1,
      durationSeconds: () => null,
    });
    expect(missing.issues.some((item) => item.code === "missing_audio")).toBe(true);
  });

  it("rejects playable audio if the rights block is stripped", () => {
    const catalog = structuredClone(sampleCatalog()) as unknown as Record<string, unknown>;
    delete catalog.rights;
    const report = validateCatalog(catalog, {
      readFile: () => Buffer.from("x"),
      byteLength: () => 1,
      durationSeconds: () => 1,
    });
    expect(report.ok).toBe(false);
    expect(report.issues.some((item) => item.code === "schema")).toBe(true);
  });
});

describe("media allowlist", () => {
  it("resolves only pilot audio and art", () => {
    const catalog = sampleCatalog();
    const audio = catalog.episodes[0]?.segments[0];
    if (!audio) throw new Error("missing audio");
    const resolved = resolvePilotFile(root, audio.publicPath, catalog);
    expect(resolved?.type).toBe("audio/mpeg");
    expect(resolved?.full.endsWith("pieza.mp3")).toBe(true);
    const forged = structuredClone(catalog);
    forged.episodes[0]!.segments[0]!.kitPath = "content/pilot/documentos/transcripcion_automatica_ES.srt";
    expect(resolvePilotFile(root, audio.publicPath, forged)).toBeNull();
    forged.episodes[0]!.segments[0]!.kitPath = "content/pilot/audio/../../documentos/secret.mp3";
    expect(resolvePilotFile(root, audio.publicPath, forged)).toBeNull();
    expect(resolvePilotFile(root, "/media/evidencias/bosch_vista_completa.jpg", catalog)).toBeNull();
  });
});

describe("srt", () => {
  it("parses a cue without dropping its words", () => {
    const cues = parseSrt("1\n00:01:52,640 --> 00:02:00,400\nuna frase de prueba sin escritura\n");
    expect(cues[0]).toMatchObject({ startSeconds: 112.64, endSeconds: 120.4, text: "una frase de prueba sin escritura" });
  });
});

describe("writer idempotence", () => {
  it("writes identical bytes into a fresh directory when asked twice", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "audite-catalog-"));
    const catalog = sampleCatalog();
    const target = path.join(dir, "manifest.json");
    const body = `${JSON.stringify(catalog, null, 2)}\n`;
    writeFileSync(target, body);
    const once = readFileSync(target);
    writeFileSync(target, body);
    expect(readFileSync(target).equals(once)).toBe(true);
  });
});
