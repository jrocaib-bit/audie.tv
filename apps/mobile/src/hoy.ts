import { racha } from "@audite/domain";
import { obraDeEpisodio, obraWebp } from "../../../packages/content/src/obras-visibles";
import { episodioAMedias } from "./actual";
import { caminoPorId, idsDeCamino, progresoCamino, type Rango } from "./caminos";

export type TarjetaHoy = { id: string; titulo: string; src: string; ruta?: string };

type Idioma = "es" | "en";

const LIBROS: { episodio: string; titulo: { es: string; en: string } }[] = [
  { episodio: "gn-01", titulo: { es: "El paraíso", en: "Paradise" } },
  { episodio: "gn-02", titulo: { es: "La expulsión", en: "The expulsion" } },
  { episodio: "gn-03", titulo: { es: "El arca", en: "The ark" } },
  { episodio: "gn-04", titulo: { es: "Babel", en: "Babel" } },
  { episodio: "gn-05", titulo: { es: "Melquisedec", en: "Melchizedek" } },
  { episodio: "gn-06", titulo: { es: "Mambré", en: "Mamre" } },
];

const CAMINOS: { episodio: string; titulo: { es: string; en: string } }[] = [
  { episodio: "gn-09", titulo: { es: "Rebeca", en: "Rebekah" } },
  { episodio: "gn-10", titulo: { es: "Esaú", en: "Esau" } },
  { episodio: "gn-08", titulo: { es: "Isaac", en: "Isaac" } },
  { episodio: "gn-11", titulo: { es: "Jacob", en: "Jacob" } },
];

const RETOS: { id: string; titulo: { es: string; en: string }; src: string; ruta?: string }[] = [
  { id: "adviento", titulo: { es: "Adviento", en: "Advent" }, src: "/obras/reto-adviento_o2-1x1.webp", ruta: "/reto/adviento-isaias" },
  { id: "navidad", titulo: { es: "Navidad", en: "Christmas" }, src: "/obras/reto-navidad_o2-1x1.webp" },
];

function deEpisodio(episodio: string, titulo: { es: string; en: string }, lang: Idioma): TarjetaHoy {
  const obra = obraDeEpisodio(episodio);
  if (!obra) throw new Error(`Sin obra visible para ${episodio}`);
  return { id: episodio, titulo: titulo[lang], src: obraWebp(obra) };
}

/** Libros, caminos y retos de Hoy. Ninguna obra se repite. */
export function tarjetasHoy(lang: Idioma = "es"): { libros: TarjetaHoy[]; caminos: TarjetaHoy[]; retos: TarjetaHoy[] } {
  return {
    libros: LIBROS.map((item) => deEpisodio(item.episodio, item.titulo, lang)),
    caminos: CAMINOS.map((item) => deEpisodio(item.episodio, item.titulo, lang)),
    retos: RETOS.map((item) => ({ id: item.id, titulo: item.titulo[lang], src: item.src, ruta: item.ruta })),
  };
}

// ---------------------------------------------------------------------------
// Modelo completo de Hoy

export type DiaSemana = { iso: string; letra: string; hecho: boolean; hoy: boolean; futuro: boolean };

function fechaLocal(iso: string): Date {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(a ?? 1970, (m ?? 1) - 1, d ?? 1, 12);
}

function aIso(fecha: Date): string {
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  const d = String(fecha.getDate()).padStart(2, "0");
  return `${fecha.getFullYear()}-${m}-${d}`;
}

/** Los siete días de la semana (lunes a domingo) que contiene `hoyIso`. */
export function semanaDe(dias: readonly string[], hoyIso: string, lang: Idioma = "es"): DiaSemana[] {
  const letras = lang === "en" ? ["M", "T", "W", "T", "F", "S", "S"] : ["L", "M", "X", "J", "V", "S", "D"];
  const hoy = fechaLocal(hoyIso);
  const lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() - ((hoy.getDay() + 6) % 7));
  const escuchados = new Set(dias);
  return letras.map((letra, i) => {
    const dia = new Date(lunes);
    dia.setDate(lunes.getDate() + i);
    const iso = aIso(dia);
    return { iso, letra, hecho: escuchados.has(iso), hoy: iso === hoyIso, futuro: iso > hoyIso };
  });
}

export function saludo(hora: number, lang: Idioma = "es"): string {
  if (lang === "en") return hora < 6 ? "Good night" : hora < 12 ? "Good morning" : hora < 20 ? "Good afternoon" : "Good evening";
  return hora < 6 ? "Buenas noches" : hora < 13 ? "Buenos días" : hora < 21 ? "Buenas tardes" : "Buenas noches";
}

export function duracionCorta(segundos: number | undefined): string {
  if (!segundos || segundos <= 0) return "";
  return `${Math.max(1, Math.round(segundos / 60))} min`;
}

export type EpisodioInfo = { id: string; titulo: string; libro: string; capitulos: string; duracion: string; src: string; ratio: number };

export type CtxHoy = {
  lang: Idioma;
  hoyIso: string;
  hora: number;
  progress: { episodes: Record<string, { positionSeconds: number; updatedAt?: string; completed: boolean } | undefined>; listenedOn: readonly string[] };
  caminoId: string;
  rangos: readonly Rango[];
  libros: readonly { id: string; name: { es: string; en: string } }[];
  titulos: Record<string, { es: string | null; en: string | null } | null | undefined>;
  duraciones: Record<string, number>;
  /** Episodio que carga el reproductor. */
  actual: string | null;
  /** Episodios con audio. El resto es «Próximamente». */
  grabados: readonly string[];
  pasosAdviento: readonly { dia: number; episodio?: string }[];
};

export function infoEpisodio(id: string, ctx: Pick<CtxHoy, "lang" | "libros" | "titulos" | "duraciones" | "rangos">): EpisodioInfo {
  const obra = obraDeEpisodio(id);
  const rango = ctx.rangos.find((r) => r.id === id);
  const bookId = obra?.libro ?? rango?.bookId ?? id.split("-")[0] ?? "";
  const libro = ctx.libros.find((l) => l.id === bookId)?.name[ctx.lang] ?? "";
  const numero = obra?.numero ?? rango?.orden ?? 0;
  return {
    id,
    titulo: ctx.titulos[id]?.[ctx.lang]?.trim() || `${libro} ${numero}`.trim(),
    libro,
    capitulos: obra?.capitulos ?? "",
    duracion: duracionCorta(ctx.duraciones[id]),
    src: obra ? obraWebp(obra) : "",
    ratio: obra && obra.ancho > 0 && obra.alto > 0 ? obra.ancho / obra.alto : 16 / 9,
  };
}

export type ModeloHoy = {
  saludo: string;
  hero: (EpisodioInfo & { retomar: boolean; fraccion: number; reproducible: boolean; actual: boolean }) | null;
  semana: DiaSemana[];
  racha: number;
  camino: { id: string; nombre: string; hechos: number; total: number; fraccion: number };
  continuar: (EpisodioInfo & { fraccion: number }) | null;
  adviento: { titulo: string; src: string; hechos: number; total: number; fraccion: number };
  explorar: { libros: TarjetaHoy[]; caminos: TarjetaHoy[]; retos: TarjetaHoy[] };
  /** Todas las obras que se pintan en Hoy, sin repetir. */
  obras: string[];
};

const ADVIENTO_SRC = "/obras/reto-adviento_o2-1x1.webp";

export function modeloHoy(ctx: CtxHoy): ModeloHoy {
  const def = caminoPorId(ctx.caminoId, ctx.rangos);
  const ids = idsDeCamino(def, ctx.rangos);
  const avance = progresoCamino(ids, ctx.progress);
  const fraccionDe = (id: string) => {
    const p = ctx.progress.episodes[id];
    const dur = ctx.duraciones[id] ?? 0;
    if (!p || p.completed || dur <= 0) return 0;
    return Math.min(1, Math.max(0, p.positionSeconds / dur));
  };
  const heroId = avance.siguiente ?? ids[0] ?? null;
  const hero = heroId ? infoEpisodio(heroId, ctx) : null;
  const usadas = new Set<string>();
  if (hero?.src) usadas.add(hero.src);

  // Un episodio a medias que no es el de hoy va en su propia fila, sin cuadro.
  const mediasId = episodioAMedias(
    Object.fromEntries(Object.entries(ctx.progress.episodes).map(([id, p]) => [id, p ? { ...p, updatedAt: p.updatedAt ?? "" } : undefined])),
    heroId,
  );
  const medias = mediasId && fraccionDe(mediasId) > 0 ? mediasId : null;
  const continuar = medias ? { ...infoEpisodio(medias, ctx), fraccion: fraccionDe(medias) } : null;

  const pasos = ctx.pasosAdviento;
  const hechosAdv = pasos.filter((p) => p.episodio && ctx.progress.episodes[p.episodio]?.completed).length;
  const adviento = {
    titulo: ctx.lang === "en" ? "Advent" : "Adviento",
    src: ADVIENTO_SRC,
    hechos: hechosAdv,
    total: pasos.length,
    fraccion: pasos.length === 0 ? 0 : hechosAdv / pasos.length,
  };
  usadas.add(ADVIENTO_SRC);

  const tarjetas = tarjetasHoy(ctx.lang);
  const sinRepetir = (lista: TarjetaHoy[]) =>
    lista.filter((item) => {
      if (usadas.has(item.src)) return false;
      usadas.add(item.src);
      return true;
    });
  const explorar = { libros: sinRepetir(tarjetas.libros), caminos: sinRepetir(tarjetas.caminos), retos: [] as TarjetaHoy[] };

  return {
    saludo: saludo(ctx.hora, ctx.lang),
    hero: hero
      ? {
          ...hero,
          retomar: fraccionDe(hero.id) > 0,
          fraccion: fraccionDe(hero.id),
          reproducible: ctx.grabados.includes(hero.id),
          actual: hero.id === ctx.actual,
        }
      : null,
    semana: semanaDe(ctx.progress.listenedOn, ctx.hoyIso, ctx.lang),
    racha: racha(ctx.progress.listenedOn, ctx.hoyIso),
    camino: { id: def.id, nombre: def.nombre[ctx.lang], hechos: avance.hechos, total: avance.total, fraccion: avance.fraccion },
    continuar,
    adviento,
    explorar,
    obras: [...usadas],
  };
}
