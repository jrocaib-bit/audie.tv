import { inicioDelPasaje, tiemposDeManifiesto } from "./lectura";
import type { Manifiesto } from "./manifiesto";

/**
 * Índice canónico capítulo → episodio.
 * Solo metadatos del manifiesto: libro, sección, capítulo, episodio y, si existe, el segundo de entrada.
 * Nunca lleva texto bíblico.
 */

export type TextoBilingue = { es: string; en: string };

export type TestamentoId = "at" | "nt";

export type SeccionId =
  | "pentateuco"
  | "historicos"
  | "sapienciales"
  | "profeticos"
  | "evangelios"
  | "hechos"
  | "pablo"
  | "hebreos"
  | "catolicas"
  | "apocalipsis";

export type SeccionCanonica = { id: SeccionId; testamento: TestamentoId; titulo: TextoBilingue; libros: readonly string[] };

export const TESTAMENTOS: readonly { id: TestamentoId; titulo: TextoBilingue }[] = [
  { id: "at", titulo: { es: "Antiguo Testamento", en: "Old Testament" } },
  { id: "nt", titulo: { es: "Nuevo Testamento", en: "New Testament" } },
];

export const SECCIONES_CANONICAS: readonly SeccionCanonica[] = [
  { id: "pentateuco", testamento: "at", titulo: { es: "Pentateuco", en: "Pentateuch" }, libros: ["gn", "ex", "lv", "nm", "dt"] },
  {
    id: "historicos",
    testamento: "at",
    titulo: { es: "Históricos", en: "Historical books" },
    libros: ["jos", "jue", "rut", "1sam", "2sam", "1re", "2re", "1cr", "2cr", "esd", "neh", "tob", "jdt", "est", "1mac", "2mac"],
  },
  { id: "sapienciales", testamento: "at", titulo: { es: "Sapienciales", en: "Wisdom books" }, libros: ["job", "sal", "prov", "ecl", "cant", "sab", "eclo"] },
  {
    id: "profeticos",
    testamento: "at",
    titulo: { es: "Proféticos", en: "Prophets" },
    libros: ["is", "jer", "lam", "bar", "ez", "dn", "os", "jl", "am", "abd", "jon", "miq", "nah", "hab", "sof", "ag", "zac", "mal"],
  },
  { id: "evangelios", testamento: "nt", titulo: { es: "Evangelios", en: "Gospels" }, libros: ["mt", "mc", "lc", "jn"] },
  { id: "hechos", testamento: "nt", titulo: { es: "Hechos", en: "Acts" }, libros: ["hch"] },
  {
    id: "pablo",
    testamento: "nt",
    titulo: { es: "Cartas de san Pablo", en: "Letters of Saint Paul" },
    libros: ["rom", "1cor", "2cor", "gal", "ef", "flp", "col", "1tes", "2tes", "1tim", "2tim", "tit", "flm"],
  },
  { id: "hebreos", testamento: "nt", titulo: { es: "Hebreos", en: "Hebrews" }, libros: ["heb"] },
  { id: "catolicas", testamento: "nt", titulo: { es: "Cartas católicas", en: "Catholic letters" }, libros: ["sant", "1pe", "2pe", "1jn", "2jn", "3jn", "jds"] },
  { id: "apocalipsis", testamento: "nt", titulo: { es: "Apocalipsis", en: "Revelation" }, libros: ["ap"] },
];

/**
 * Capítulos que la edición del manifiesto une con otro y que, por eso, no aparecen en ningún rango.
 * La numeración que busca la gente los muestra. El índice los enlaza al episodio del capítulo con el que van.
 */
export const UNIONES_DE_EDICION: readonly { libro: string; capitulo: number; con: number; nota: TextoBilingue }[] = [
  {
    libro: "sal",
    capitulo: 10,
    con: 9,
    nota: {
      es: "Esta edición une el salmo 9 y el 10. Los dos se escuchan en el mismo episodio.",
      en: "This edition joins Psalm 9 and Psalm 10. You hear both in the same episode.",
    },
  },
];

export type EnlaceCapitulo = { id: string; segundo?: number };

export type UnionCapitulo = { con: number; episodio: string; nota: TextoBilingue };

export type CapituloIndice = { n: number; episodios: EnlaceCapitulo[]; unido?: UnionCapitulo };

export type EpisodioIndice = {
  id: string;
  orden: number;
  desde: number;
  hasta: number;
  titulo: TextoBilingue;
  titulo_corto: TextoBilingue;
};

export type LibroIndice = {
  id: string;
  orden: number;
  testamento: TestamentoId;
  deuterocanonico: boolean;
  titulo: TextoBilingue;
  capitulos_total: number;
  episodios: EpisodioIndice[];
  capitulos: CapituloIndice[];
};

export type SeccionIndice = { id: SeccionId; titulo: TextoBilingue; libros: LibroIndice[] };

export type TestamentoIndice = { id: TestamentoId; titulo: TextoBilingue; secciones: SeccionIndice[] };

export type SinRangoExplicito = { libro: string; capitulo: number; episodio_unido: string | null; unido_con: number | null; nota: TextoBilingue | null };

export type ResumenIndice = {
  libros: number;
  episodios: number;
  capitulos: number;
  con_episodio: number;
  sin_rango_explicito: number;
  varios_episodios: number;
  con_segundo: number;
};

export type IndiceBiblia = {
  version: 1;
  fuente: { manifiesto_version: number; manifiesto_actualizado: string };
  resumen: ResumenIndice;
  sin_rango: SinRangoExplicito[];
  testamentos: TestamentoIndice[];
};

/** Lee «1-2», «24» o «119» y devuelve el primer y el último capítulo. Si falta, mira el rango «1:1-2:25». */
export function tramoDeCapitulos(capitulos: string | null | undefined, rango?: string | null): { desde: number; hasta: number } | null {
  const simple = capitulos?.trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/);
  if (simple) {
    const desde = Number(simple[1]);
    const hasta = Number(simple[2] ?? simple[1]);
    return desde > 0 && hasta >= desde ? { desde, hasta } : null;
  }
  const largo = rango?.trim().match(/^(\d+):\d+-(\d+):\d+$/);
  if (largo) {
    const desde = Number(largo[1]);
    const hasta = Number(largo[2]);
    return desde > 0 && hasta >= desde ? { desde, hasta } : null;
  }
  return null;
}

function bilingue(valor: { es?: string; en?: string } | undefined, otro: TextoBilingue): TextoBilingue {
  return { es: valor?.es?.trim() || otro.es, en: valor?.en?.trim() || otro.en };
}

/** Construye el índice. Lanza un error si un libro del manifiesto no tiene sección o si falta alguno. */
export function construirIndice(manifiesto: Manifiesto): IndiceBiblia {
  const porId = new Map(manifiesto.libros.map((libro) => [libro.id, libro]));
  const asignados = SECCIONES_CANONICAS.flatMap((seccion) => seccion.libros);
  const sinSeccion = manifiesto.libros.filter((libro) => !asignados.includes(libro.id)).map((libro) => libro.id);
  if (sinSeccion.length > 0) throw new Error(`Libros sin sección canónica: ${sinSeccion.join(", ")}`);
  const ausentes = asignados.filter((id) => !porId.has(id));
  if (ausentes.length > 0) throw new Error(`Libros de las secciones que faltan en el manifiesto: ${ausentes.join(", ")}`);

  const sinRango: SinRangoExplicito[] = [];
  const resumen: ResumenIndice = { libros: 0, episodios: 0, capitulos: 0, con_episodio: 0, sin_rango_explicito: 0, varios_episodios: 0, con_segundo: 0 };

  const libroIndice = (id: string, testamento: TestamentoId): LibroIndice => {
    const libro = porId.get(id)!;
    if ((libro.testamento === "NT" ? "nt" : "at") !== testamento) throw new Error(`${id} está en el testamento equivocado`);
    const ordenados = libro.episodios.slice().sort((a, b) => a.orden - b.orden || a.id.localeCompare(b.id));
    const episodios: EpisodioIndice[] = [];
    const porCapitulo = new Map<number, EnlaceCapitulo[]>();
    for (const episodio of ordenados) {
      const tramo = tramoDeCapitulos(episodio.capitulos, episodio.rango);
      if (!tramo) throw new Error(`${episodio.id} no trae capítulos legibles`);
      const titulo = bilingue(episodio.titulo, { es: episodio.id, en: episodio.id });
      episodios.push({ id: episodio.id, orden: episodio.orden, desde: tramo.desde, hasta: tramo.hasta, titulo, titulo_corto: bilingue(episodio.titulo_corto, titulo) });
      const tiempos = tiemposDeManifiesto(episodio.tiempos);
      for (let n = tramo.desde; n <= tramo.hasta; n += 1) {
        const segundo = inicioDelPasaje(tiempos, n, 1, Number.MAX_SAFE_INTEGER);
        const enlace: EnlaceCapitulo = segundo == null ? { id: episodio.id } : { id: episodio.id, segundo };
        porCapitulo.set(n, [...(porCapitulo.get(n) ?? []), enlace]);
      }
    }
    const declarado = libro.capitulos_total ?? 0;
    const maximo = Math.max(declarado, ...porCapitulo.keys());
    const capitulos: CapituloIndice[] = [];
    for (let n = 1; n <= maximo; n += 1) {
      const enlaces = porCapitulo.get(n) ?? [];
      const capitulo: CapituloIndice = { n, episodios: enlaces };
      if (enlaces.length === 0) {
        const union = UNIONES_DE_EDICION.find((item) => item.libro === id && item.capitulo === n);
        const episodioUnido = union ? porCapitulo.get(union.con)?.[0]?.id ?? null : null;
        if (union && episodioUnido) capitulo.unido = { con: union.con, episodio: episodioUnido, nota: union.nota };
        sinRango.push({ libro: id, capitulo: n, episodio_unido: episodioUnido, unido_con: union?.con ?? null, nota: union?.nota ?? null });
        resumen.sin_rango_explicito += 1;
      } else {
        resumen.con_episodio += 1;
      }
      if (enlaces.length > 1) resumen.varios_episodios += 1;
      if (enlaces.some((enlace) => enlace.segundo != null)) resumen.con_segundo += 1;
      capitulos.push(capitulo);
    }
    resumen.libros += 1;
    resumen.episodios += episodios.length;
    resumen.capitulos += capitulos.length;
    return {
      id,
      orden: libro.orden,
      testamento,
      deuterocanonico: Boolean(libro.deuterocanonico),
      titulo: bilingue(libro.titulo, { es: id, en: id }),
      capitulos_total: capitulos.length,
      episodios,
      capitulos,
    };
  };

  const testamentos = TESTAMENTOS.map((testamento) => ({
    id: testamento.id,
    titulo: testamento.titulo,
    secciones: SECCIONES_CANONICAS.filter((seccion) => seccion.testamento === testamento.id).map((seccion) => ({
      id: seccion.id,
      titulo: seccion.titulo,
      libros: seccion.libros.map((id) => libroIndice(id, testamento.id)),
    })),
  }));

  return {
    version: 1,
    fuente: { manifiesto_version: manifiesto.version, manifiesto_actualizado: manifiesto.actualizado },
    resumen,
    sin_rango: sinRango,
    testamentos,
  };
}

export function librosDelIndice(indice: IndiceBiblia): LibroIndice[] {
  return indice.testamentos.flatMap((testamento) => testamento.secciones.flatMap((seccion) => seccion.libros));
}

/** Episodios a los que lleva un capítulo. Un capítulo unido lleva al episodio del capítulo con el que va. */
export function destinosDeCapitulo(capitulo: CapituloIndice): EnlaceCapitulo[] {
  if (capitulo.episodios.length > 0) return capitulo.episodios;
  return capitulo.unido ? [{ id: capitulo.unido.episodio }] : [];
}

/** Ruta web del episodio. Añade ?t= solo si hay marca de tiempo. */
export function hrefDeCapitulo(lang: string, enlace: EnlaceCapitulo): string {
  const base = `/${lang}/oir/${encodeURIComponent(enlace.id)}`;
  return enlace.segundo != null && enlace.segundo >= 0 ? `${base}?t=${Math.floor(enlace.segundo)}` : base;
}

/** «Génesis 1 a 2», «Genesis 1 to 2», «Salmos 119». Sin rayas. */
export function rotuloTramo(nombre: string, desde: number, hasta: number, lang: string): string {
  if (desde === hasta) return `${nombre} ${desde}`;
  return `${nombre} ${desde} ${lang === "en" ? "to" : "a"} ${hasta}`;
}

function plano(texto: string): string {
  return texto.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase().replace(/\s+/g, " ").trim();
}

/** Coincide por nombre en los dos idiomas o por sigla («gn», «1sam», «1 sam»). */
export function libroCoincide(libro: Pick<LibroIndice, "id" | "titulo">, consulta: string): boolean {
  const busqueda = plano(consulta);
  if (!busqueda) return true;
  const sinEspacios = busqueda.replace(/ /g, "");
  return plano(libro.titulo.es).includes(busqueda) || plano(libro.titulo.en).includes(busqueda) || libro.id === sinEspacios || libro.id.startsWith(sinEspacios);
}

/** «Génesis 1», «Salmo 10», «Psalm 23». */
export function nombreDeCapitulo(libro: Pick<LibroIndice, "id" | "titulo">, n: number, lang: string): string {
  const idioma = lang === "en" ? "en" : "es";
  if (libro.id === "sal") return `${idioma === "en" ? "Psalm" : "Salmo"} ${n}`;
  return `${libro.titulo[idioma]} ${n}`;
}

export function episodioDelLibro(libro: Pick<LibroIndice, "episodios">, id: string): EpisodioIndice | null {
  return libro.episodios.find((episodio) => episodio.id === id) ?? null;
}
