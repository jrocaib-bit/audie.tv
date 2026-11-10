import indiceCatalogo from "../../../content/canon/catalogo-indice.json";
import libroGenesis from "../../../content/canon/libros/gn.json";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { AppCatalog, Artwork, Book, CaptionCue, Episode, ImageCue, PendingEpisode } from "@audite/domain";
import { creditoTexto, idiomaReproducible, presentacionEpisodio, rutaSegura, tiemposDeManifiesto, type EpisodioManifiesto, type Manifiesto } from "@audite/domain";
import { parseSrt } from "./srt";

export type { AppCatalog };

function texto(valor: string | undefined): string {
  return valor ?? "";
}

function vttACues(vtt: string): CaptionCue[] {
  const body = vtt.replace(/^\uFEFF/, "").replace(/^WEBVTT[^\n]*\n/, "");
  const blocks = body.replace(/\r\n/g, "\n").trim().split(/\n\n+/);
  return blocks
    .map((block) => {
      const lines = block.split("\n").filter((line) => line.trim().length > 0);
      const timeIndex = lines.findIndex((line) => line.includes("-->"));
      if (timeIndex < 0) return null;
      const [startRaw, endRaw] = (lines[timeIndex] ?? "").split("-->");
      const text = lines.slice(timeIndex + 1).join(" ").replace(/\s+/g, " ").trim();
      if (!text || !startRaw || !endRaw) return null;
      return {
        startSeconds: marca(startRaw),
        endSeconds: marca(endRaw),
        text,
        provenance: text.includes("las fiestas, los días") ? ("reviewed_correction" as const) : ("automatic" as const),
      };
    })
    .filter((cue): cue is CaptionCue => cue !== null);
}

function marca(valor: string): number {
  const match = valor.trim().match(/(\d+):(\d+):(\d+)[.,](\d+)/);
  if (!match) return 0;
  return Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]) + Number(match[4].padEnd(3, "0").slice(0, 3)) / 1000;
}

export function construirCatalogo(manifiesto: Manifiesto, raiz: string, publico = "/canon"): AppCatalog {
  const existe = (ruta: string) => rutaSegura(ruta) && existsSync(path.join(raiz, ruta));
  const books: Book[] = manifiesto.libros
    .slice()
    .sort((a, b) => a.orden - b.orden)
    .map((libro) => ({
      id: libro.id,
      testament: libro.testamento === "AT" ? "ot" : "nt",
      order: libro.orden,
      name: { es: texto(libro.titulo?.es), en: texto(libro.titulo?.en) },
      status: libro.episodios.some((episodio) =>
        Object.values(episodio.idiomas).some((idioma) => idiomaReproducible(idioma, Boolean(idioma.master && existe(idioma.master)))),
      )
        ? "pilot"
        : "not_in_pilot",
      deuterocanonico: libro.deuterocanonico === true,
      capitulosTotal: libro.capitulos_total ?? null,
    }));

  const episodes: Episode[] = [];
  const pendientes: PendingEpisode[] = [];
  const artworks: Artwork[] = [];
  const cues: ImageCue[] = [];
  const captions: CaptionCue[] = [];
  const vistos = new Set<string>();
  const rangos: AppCatalog["rangos"] = [];

  for (const libro of manifiesto.libros) {
    for (const episodio of libro.episodios.slice().sort((a, b) => a.orden - b.orden)) {
      rangos.push({ id: episodio.id, bookId: libro.id, orden: episodio.orden, rango: episodio.rango ?? "" });
      const reproducible = Object.entries(episodio.idiomas).find(([, idioma]) =>
        idiomaReproducible(idioma, Boolean(idioma.master && existe(idioma.master))),
      );
      if (!reproducible) {
        const rotulos = nombres(episodio);
        pendientes.push({
          id: episodio.id,
          bookId: libro.id,
          orden: episodio.orden,
          capitulos: episodio.capitulos ?? null,
          rango: episodio.rango ?? null,
          titulo: rotulos.titulo,
          tituloCorto: rotulos.tituloCorto,
          etiqueta: rotulos.etiqueta,
          propuesta: episodio.propuesta === true,
          presentacion: presentacionEpisodio(episodio),
        });
        continue;
      }
      const [codigo, idioma] = reproducible;
      const tiempos = tiemposDeManifiesto(episodio.tiempos);
      const master = idioma.master ?? "";
      const archivo = path.join(raiz, master);
      const bytes = statSync(archivo).size;
      const hash = createHash("sha256").update(readFileSync(archivo)).digest("hex");
      episodes.push({
        id: episodio.id,
        locale: codigo === "en" || codigo === "it" || codigo === "es" ? codigo : "es",
        bookId: libro.id,
        number: episodio.orden,
        title: texto(episodio.titulo?.es),
        scriptureRangeLabel: [libro.titulo?.es, episodio.capitulos].filter(Boolean).join(" "),
        status: "playable",
        durationSeconds: idioma.duracion_s ?? 0,
        segments: [
          {
            id: `${episodio.id}-master`,
            publicPath: `${publico}/${master}`,
            kitPath: path.posix.join("content/canon", master),
            sha256: hash,
            startSeconds: 0,
            durationSeconds: idioma.duracion_s ?? 0,
            bytes,
          },
        ],
        summary: { es: texto(episodio.resumen?.es), en: texto(episodio.resumen?.en) },
        ...nombres(episodio),
        ...(tiempos.length > 0 ? { tiempos } : {}),
      });
      if (idioma.subtitulos && existe(idioma.subtitulos)) {
        captions.push(...vttACues(readFileSync(path.join(raiz, idioma.subtitulos), "utf8")));
      }
      for (const [indice, arte] of (episodio.arte ?? []).entries()) {
        if (!arte.archivo || !existe(arte.archivo)) continue;
        const id = path.basename(arte.archivo, path.extname(arte.archivo));
        if (!vistos.has(id)) {
          vistos.add(id);
          const artePath = path.join(raiz, arte.archivo);
          artworks.push({
            id,
            workId: id,
            title: { es: texto(arte.titulo?.es) || "Pendiente", en: texto(arte.titulo?.en) || "Pending" },
            artist: { es: texto(arte.autor) || "Pendiente", en: texto(arte.autor) || "Pending" },
            date: texto(arte.anio) || "Pendiente",
            location: { es: texto(arte.ubicacion) || "Pendiente", en: texto(arte.ubicacion) || "Pending" },
            license: texto(arte.derechos) || "Pendiente",
            credit: texto(arte.derechos) || "Pendiente",
            creditRequirement: texto(arte.derechos) || "Pendiente",
            sourcePage: arte.fuente ?? "https://commons.wikimedia.org",
            sourceFile: arte.fuente ?? "https://commons.wikimedia.org",
            publicPath: `${publico}/${arte.archivo}`,
            kitPath: path.posix.join("content/canon", arte.archivo),
            sha256: createHash("sha256").update(readFileSync(artePath)).digest("hex"),
            bytes: statSync(artePath).size,
            width: arte.ancho ?? 1,
            height: arte.alto ?? 1,
            crop: null,
            editorialRole: texto(arte.nota) || "Pendiente",
            displayable: true,
          });
        }
        if (arte.inicio_s != null && arte.fin_s != null) {
          cues.push({
            startSeconds: arte.inicio_s,
            endSeconds: arte.fin_s,
            artworkId: id,
            sectionLabel: texto(arte.titulo?.es) || `pieza ${indice + 1}`,
            editorialNote: texto(arte.nota) || "Pendiente",
          });
        }
      }
    }
  }

  const fuenteTexto = { es: creditoTexto(manifiesto.fuente_texto, "es"), en: creditoTexto(manifiesto.fuente_texto, "en") };
  const outlineNote = {
    es: "Lo que todavía no se puede oír está en preparación.",
    en: "What cannot be heard yet is in preparation.",
  };
  const vistosIdioma = new Set<string>();
  const locales = manifiesto.idiomas.flatMap((codigo) => {
    const code = codigo === "en" || codigo === "it" || codigo === "es" ? codigo : null;
    if (!code || vistosIdioma.has(code)) return [];
    vistosIdioma.add(code);
    const conAudio = manifiesto.libros.some((libro) =>
      libro.episodios.some((episodio) => idiomaReproducible(episodio.idiomas[codigo], Boolean(episodio.idiomas[codigo]?.master && existe(episodio.idiomas[codigo].master ?? "")))),
    );
    return [{
      code: code as "es" | "en" | "it",
      label: { es: codigo, en: codigo },
      playback: conAudio ? ("pilot" as const) : ("not_attached" as const),
      note: conAudio
        ? { es: "Se puede escuchar.", en: "Ready to hear." }
        : { es: "En preparación.", en: "In preparation." },
    }];
  });

  return { actualizado: manifiesto.actualizado, books, episodes, pendientes, artworks, cues, captions, locales, outlineNote, fuenteTexto, rangos };
}

function nombres(episodio: EpisodioManifiesto) {
  return {
    titulo: { es: episodio.titulo?.es ?? null, en: episodio.titulo?.en ?? null },
    tituloCorto: { es: episodio.titulo_corto?.es ?? null, en: episodio.titulo_corto?.en ?? null },
    etiqueta: { es: episodio.etiqueta?.es ?? null, en: episodio.etiqueta?.en ?? null },
  };
}

export function volcarCatalogo(catalogo: AppCatalog, destino: string): void {
  const indice = { ...catalogo, episodes: [], pendientes: [], artworks: [], cues: [], captions: [] };
  writeFileSync(path.join(destino, "catalogo-indice.json"), JSON.stringify(indice));
  const carpeta = path.join(destino, "libros");
  mkdirSync(carpeta, { recursive: true });
  for (const libro of catalogo.books) {
    const episodios = catalogo.pendientes.filter((episodio) => episodio.bookId === libro.id);
    writeFileSync(path.join(carpeta, `${libro.id}.json`), JSON.stringify({ id: libro.id, episodios }));
  }
}

function tonoDemo(): string {
  const candidatos = [
    path.resolve(process.cwd(), "public/demo/demo-tono.mp3"),
    path.resolve(process.cwd(), "apps/web/public/demo/demo-tono.mp3"),
    path.resolve(process.cwd(), "../../apps/web/public/demo/demo-tono.mp3"),
  ];
  return candidatos.find((ruta) => existsSync(ruta)) ?? "";
}

function episodioDemo(ruta: string): AppCatalog["episodes"][number] {
  const bytes = readFileSync(ruta);
  const duracion = 48.039;
  return {
    id: "gn-01",
    locale: "es",
    bookId: "gn",
    number: 1,
    title: "En el principio: la creación y el hombre",
    scriptureRangeLabel: "Génesis 1:1–2:25",
    status: "playable",
    durationSeconds: duracion,
    segments: [
      {
        id: "gn-01-demo",
        publicPath: "/demo/demo-tono.mp3",
        kitPath: "apps/web/public/demo/demo-tono.mp3",
        sha256: createHash("sha256").update(bytes).digest("hex"),
        startSeconds: 0,
        durationSeconds: duracion,
        bytes: bytes.length,
      },
    ],
    summary: {
      es: "Tono de demostración para el reproductor. No es la narración.",
      en: "A demonstration tone for the player. It is not the narration.",
    },
    titulo: { es: "En el principio: la creación y el hombre", en: "In the Beginning: Creation and Humankind" },
    tituloCorto: { es: "En el principio", en: "In the Beginning" },
    etiqueta: { es: "Génesis 1–2", en: "Genesis 1–2" },
  };
}

export function loadAppCatalog(): AppCatalog {
  const indice = indiceCatalogo as AppCatalog;
  const genesis = libroGenesis as { episodios: AppCatalog["pendientes"] };
  const base = { ...indice, pendientes: genesis.episodios };
  if (process.env.AUDITE_DEMO !== "1") return base;
  const tono = tonoDemo();
  if (!tono) return base;
  return { ...base, episodes: [episodioDemo(tono)] };
}

export function leerRangos(): AppCatalog["rangos"] {
  return (indiceCatalogo as AppCatalog).rangos ?? [];
}

export function leerLibro(id: string): AppCatalog["pendientes"] {
  if (!/^[\w-]+$/.test(id)) return [];
  const archivo = path.resolve(process.cwd(), "content/canon/libros", `${id}.json`);
  const alterno = path.resolve(process.cwd(), "../../content/canon/libros", `${id}.json`);
  const ruta = existsSync(archivo) ? archivo : existsSync(alterno) ? alterno : "";
  if (!ruta) return [];
  const dato = JSON.parse(readFileSync(ruta, "utf8")) as { episodios?: AppCatalog["pendientes"] };
  return dato.episodios ?? [];
}
