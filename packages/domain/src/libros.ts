/**
 * Sección de libros: tipos del JSON canónico y lógica pura compartida entre la web y la app.
 *
 * Nada de aquí lee disco ni red. El texto de los libros nunca se importa en un bundle:
 * lo sirve la API del servidor y este módulo solo sabe cortarlo y pintarlo.
 */

export type TipoCapitulo = "prologo" | "capitulo" | "epilogo" | "bibliografia";
export type TipoBloque = "parrafo" | "pasaje" | "subtitulo";

export type ReferenciaLibro = {
  raw: string;
  libro_id: string;
  capitulo_inicio?: number | null;
  versiculo_inicio?: number | null;
  capitulo_fin?: number | null;
  versiculo_fin?: number | null;
  episodio_id: string | null;
};

export type BloqueLibro = {
  id: string;
  tipo: TipoBloque;
  texto: string;
  html: string;
  referencias: ReferenciaLibro[];
};

export type CapituloLibro = {
  id: string;
  tipo: TipoCapitulo;
  orden: number;
  numero: number | null;
  titulo: string;
  es_adelanto: boolean;
  bloques: BloqueLibro[];
};

/** JSON canónico de un volumen (solo servidor). */
export type LibroTexto = {
  id: string;
  titulo: string;
  subtitulo: string;
  idioma: string;
  libro_biblico: string;
  libro_id: string;
  adelanto_hasta_capitulo_id: string | null;
  capitulos: CapituloLibro[];
};

/** Entrada del índice: títulos de todos los capítulos, nunca su texto. */
export type EntradaIndice = {
  id: string;
  tipo: TipoCapitulo;
  orden: number;
  numero: number | null;
  titulo: string;
  es_adelanto: boolean;
};

export type LibroCortado = {
  id: string;
  titulo: string;
  subtitulo: string;
  idioma: string;
  libro_biblico: string;
  libro_id: string;
  adelanto_hasta_capitulo_id: string | null;
  indice: EntradaIndice[];
  /** Solo capítulos con derecho a verse, con sus bloques. */
  capitulos: CapituloLibro[];
};

export type EpisodioDeLibro = { episodio_id: string; etiqueta: string; titulo: string };

export type Disponibilidad = "lectura" | "preparandose" | "borrador";

/** Ficha pública del catálogo. Sin texto, sin rutas del disco. */
export type LibroFicha = {
  id: string;
  slug: string;
  volumen: number;
  titulo: string;
  subtitulo: string;
  idioma: string;
  libro_biblico: string;
  libro_id: string;
  estado: "completo" | "borrador" | "publicado";
  disponibilidad: Disponibilidad;
  palabras: number | null;
  adelanto_hasta_capitulo_id: string | null;
  indice: EntradaIndice[];
  audiolibro_estado: "previsto" | "disponible";
  episodios_del_libro_comentado: EpisodioDeLibro[];
  episodios_cruzados: EpisodioDeLibro[];
  /** Solo viaja si el servidor tiene el flag de Amazon encendido. Nunca hay URL de Kindle aquí. */
  amazon_paperback_url: string | null;
};

export type VistaLector = "sin-sesion" | "gratuito" | "premium";

/** Capítulos de adelanto: los marcados `es_adelanto` y todo hasta `adelanto_hasta_capitulo_id`. */
export function idsDeAdelanto(libro: { adelanto_hasta_capitulo_id: string | null; capitulos: Pick<CapituloLibro, "id" | "orden" | "es_adelanto">[] }): Set<string> {
  const limite = libro.adelanto_hasta_capitulo_id
    ? libro.capitulos.find((capitulo) => capitulo.id === libro.adelanto_hasta_capitulo_id)?.orden ?? null
    : null;
  return new Set(
    libro.capitulos
      .filter((capitulo) => capitulo.es_adelanto || (limite !== null && capitulo.orden <= limite))
      .map((capitulo) => capitulo.id),
  );
}

export function indiceDe(libro: Pick<LibroTexto, "adelanto_hasta_capitulo_id" | "capitulos">): EntradaIndice[] {
  const adelanto = idsDeAdelanto(libro);
  return [...libro.capitulos]
    .sort((a, b) => a.orden - b.orden)
    .map((capitulo) => ({
      id: capitulo.id,
      tipo: capitulo.tipo,
      orden: capitulo.orden,
      numero: capitulo.numero,
      titulo: capitulo.titulo,
      es_adelanto: adelanto.has(capitulo.id),
    }));
}

/**
 * Corte del libro. Sin premium solo salen los bloques del adelanto.
 * El índice lista todos los títulos y nada más de los capítulos posteriores.
 */
export function cortarLibro(libro: LibroTexto, premium: boolean): LibroCortado {
  const adelanto = idsDeAdelanto(libro);
  const visibles = [...libro.capitulos]
    .filter((capitulo) => premium || adelanto.has(capitulo.id))
    .sort((a, b) => a.orden - b.orden)
    .map((capitulo) => ({ ...capitulo, es_adelanto: adelanto.has(capitulo.id) }));
  return {
    id: libro.id,
    titulo: libro.titulo,
    subtitulo: libro.subtitulo,
    idioma: libro.idioma,
    libro_biblico: libro.libro_biblico,
    libro_id: libro.libro_id,
    adelanto_hasta_capitulo_id: libro.adelanto_hasta_capitulo_id,
    indice: indiceDe(libro),
    capitulos: visibles,
  };
}

export type ResultadoCapitulo =
  | { ok: true; capitulo: CapituloLibro }
  | { ok: false; motivo: "no-encontrado" | "sin-sesion" | "sin-permiso" };

/** Decide si una vista puede leer un capítulo. 401 sin sesión, 403 con cuenta gratuita. */
export function capituloParaVista(libro: LibroTexto, capituloId: string, vista: VistaLector): ResultadoCapitulo {
  const capitulo = libro.capitulos.find((item) => item.id === capituloId);
  if (!capitulo) return { ok: false, motivo: "no-encontrado" };
  if (idsDeAdelanto(libro).has(capitulo.id)) return { ok: true, capitulo: { ...capitulo, es_adelanto: true } };
  if (vista === "premium") return { ok: true, capitulo };
  return { ok: false, motivo: vista === "sin-sesion" ? "sin-sesion" : "sin-permiso" };
}

export function rotuloCapitulo(entrada: Pick<EntradaIndice, "tipo" | "numero">): string {
  if (entrada.tipo === "prologo") return "Prólogo";
  if (entrada.tipo === "epilogo") return "Epílogo";
  if (entrada.tipo === "bibliografia") return "Bibliografía";
  return entrada.numero ? `Capítulo ${entrada.numero}` : "Capítulo";
}

// ---------------------------------------------------------------------------------------------
// Texto de un bloque: se interpreta el `html` sin DOM y sin dangerouslySetInnerHTML.
// Solo sobreviven em, strong, br y los enlaces ref-biblica con un episodio válido.
// ---------------------------------------------------------------------------------------------

export type TrozoTexto =
  | { tipo: "texto"; texto: string; em?: boolean; strong?: boolean }
  | { tipo: "ref"; texto: string; episodio: string; ref: string; em?: boolean }
  | { tipo: "br" };

const ENTIDADES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

function decodificar(texto: string): string {
  return texto.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entero, nombre: string) => {
    if (nombre.startsWith("#x") || nombre.startsWith("#X")) return String.fromCodePoint(Number.parseInt(nombre.slice(2), 16));
    if (nombre.startsWith("#")) return String.fromCodePoint(Number.parseInt(nombre.slice(1), 10));
    return ENTIDADES[nombre.toLowerCase()] ?? entero;
  });
}

function atributo(etiqueta: string, nombre: string): string | null {
  const acierto = new RegExp(`\\s${nombre}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, "i").exec(etiqueta);
  return acierto ? decodificar(acierto[1] ?? acierto[2] ?? "") : null;
}

const EPISODIO_VALIDO = /^[a-z0-9][a-z0-9-]{0,40}$/;
const HREF_EPISODIO = /^\/[a-z]{2}\/episodio\/([a-z0-9][a-z0-9-]{0,40})$/;

/** Episodios de un enlace de referencia: `data-episodio` y, si cruza varios, `data-episodios`. */
export function episodiosDeEnlace(etiqueta: string): string[] {
  const primero = atributo(etiqueta, "data-episodio");
  const varios = (atributo(etiqueta, "data-episodios") ?? "").split(/\s+/);
  const href = HREF_EPISODIO.exec(atributo(etiqueta, "href") ?? "")?.[1] ?? null;
  const lista = [primero ?? href, ...varios].filter((id): id is string => Boolean(id) && EPISODIO_VALIDO.test(id as string));
  return [...new Set(lista)];
}

export function trozosDeHtml(html: string): TrozoTexto[] {
  const salida: TrozoTexto[] = [];
  const pila: { nombre: string; ref?: { episodio: string; ref: string } }[] = [];
  const patron = /<(\/?)([a-z][a-z0-9]*)\b([^>]*)>|([^<]+)|</gi;
  let acierto: RegExpExecArray | null;
  while ((acierto = patron.exec(html)) !== null) {
    if (acierto[4] !== undefined) {
      const texto = decodificar(acierto[4]);
      const em = pila.some((item) => item.nombre === "em");
      const strong = pila.some((item) => item.nombre === "strong");
      const ref = [...pila].reverse().find((item) => item.ref)?.ref;
      if (ref) salida.push({ tipo: "ref", texto, episodio: ref.episodio, ref: ref.ref, ...(em ? { em } : {}) });
      else salida.push({ tipo: "texto", texto, ...(em ? { em } : {}), ...(strong ? { strong } : {}) });
      continue;
    }
    if (acierto[2] === undefined) continue;
    const cierre = acierto[1] === "/";
    const nombre = acierto[2].toLowerCase();
    if (nombre === "br") {
      if (!cierre) salida.push({ tipo: "br" });
      continue;
    }
    if (nombre !== "em" && nombre !== "strong" && nombre !== "a") continue;
    if (cierre) {
      const indice = pila.map((item) => item.nombre).lastIndexOf(nombre);
      if (indice >= 0) pila.splice(indice, 1);
      continue;
    }
    if (nombre === "a") {
      const etiqueta = acierto[3] ?? "";
      const clases = (atributo(etiqueta, "class") ?? "").split(/\s+/);
      const episodio = clases.includes("ref-biblica") ? episodiosDeEnlace(etiqueta)[0] : undefined;
      pila.push({ nombre, ...(episodio ? { ref: { episodio, ref: atributo(etiqueta, "data-ref") ?? "" } } : {}) });
    } else {
      pila.push({ nombre });
    }
  }
  return salida.filter((trozo) => trozo.tipo === "br" || trozo.texto.length > 0);
}

export function textoDeTrozos(trozos: TrozoTexto[]): string {
  return trozos.map((trozo) => (trozo.tipo === "br" ? "\n" : trozo.texto)).join("");
}

export type RangoSubrayado = { id: string; inicio: number; fin: number };
export type TrozoPintado = TrozoTexto & { subrayados?: string[] };

/**
 * Parte los trozos por los rangos subrayados. Los desplazamientos son sobre `textoDeTrozos`,
 * igual en la web y en la app, para que un subrayado caiga en el mismo sitio en las dos.
 */
export function aplicarSubrayados(trozos: TrozoTexto[], rangos: RangoSubrayado[]): TrozoPintado[] {
  if (rangos.length === 0) return trozos;
  const salida: TrozoPintado[] = [];
  let posicion = 0;
  for (const trozo of trozos) {
    if (trozo.tipo === "br") {
      salida.push(trozo);
      posicion += 1;
      continue;
    }
    const inicio = posicion;
    const fin = posicion + trozo.texto.length;
    posicion = fin;
    const cortes = new Set<number>([0, trozo.texto.length]);
    for (const rango of rangos) {
      for (const corte of [rango.inicio, rango.fin]) {
        if (corte > inicio && corte < fin) cortes.add(corte - inicio);
      }
    }
    const puntos = [...cortes].sort((a, b) => a - b);
    for (let i = 0; i < puntos.length - 1; i += 1) {
      const desde = puntos[i] as number;
      const hasta = puntos[i + 1] as number;
      const ids = rangos.filter((rango) => rango.inicio < inicio + hasta && rango.fin > inicio + desde).map((rango) => rango.id);
      salida.push({ ...trozo, texto: trozo.texto.slice(desde, hasta), ...(ids.length ? { subrayados: ids } : {}) });
    }
  }
  return salida;
}

// ---------------------------------------------------------------------------------------------
// Recomendaciones de libros para un episodio (semilla: libros.json)
// ---------------------------------------------------------------------------------------------

export type LibroParaRecomendar = Pick<LibroFicha, "id" | "titulo" | "subtitulo" | "volumen" | "libro_id" | "disponibilidad"> & {
  episodios_del_libro_comentado: { episodio_id: string }[];
  episodios_cruzados: { episodio_id: string }[];
};

export type RecomendacionLibro = {
  id: string;
  titulo: string;
  subtitulo: string;
  volumen: number;
  motivo: "propio" | "cruce";
  /** Capítulo concreto que cita el episodio, si se sabe. Lo rellena el servidor con el JSON. */
  capitulo_id?: string | null;
};

export const MAX_RECOMENDACIONES = 3;

/** Libro de la Escritura al que pertenece un episodio: `gn-10` → `gn`, `1cor-02` → `1cor`. */
export function libroDeEpisodio(episodioId: string): string {
  return episodioId.split("-")[0] ?? "";
}

/**
 * El volumen del propio libro va primero, luego los cruces, máximo 3.
 * Los borradores no se recomiendan: sin lectura no hay nada que enlazar.
 */
export function recomendarLibros(episodioId: string, catalogo: readonly LibroParaRecomendar[], max = MAX_RECOMENDACIONES): RecomendacionLibro[] {
  const libro = libroDeEpisodio(episodioId);
  const leibles = [...catalogo].filter((item) => item.disponibilidad !== "borrador").sort((a, b) => a.volumen - b.volumen);
  const propios = leibles.filter((item) => item.libro_id === libro);
  const cruces = leibles.filter((item) => item.libro_id !== libro && item.episodios_cruzados.some((e) => e.episodio_id === episodioId));
  const vistos = new Set<string>();
  const salida: RecomendacionLibro[] = [];
  for (const [lista, motivo] of [[propios, "propio"], [cruces, "cruce"]] as const) {
    for (const item of lista) {
      if (vistos.has(item.id) || salida.length >= max) continue;
      vistos.add(item.id);
      salida.push({ id: item.id, titulo: item.titulo, subtitulo: item.subtitulo, volumen: item.volumen, motivo });
    }
  }
  return salida;
}

/** Primer capítulo cuyo texto cita el episodio. Solo servidor, con el JSON ya cargado. */
export function capituloQueCita(libro: Pick<LibroTexto, "capitulos">, episodioId: string): string | null {
  const ordenados = [...libro.capitulos].sort((a, b) => a.orden - b.orden);
  for (const capitulo of ordenados) {
    if (capitulo.bloques.some((bloque) => bloque.referencias.some((ref) => ref.episodio_id === episodioId))) return capitulo.id;
  }
  return null;
}

// ---------------------------------------------------------------------------------------------
// Rutas y flags
// ---------------------------------------------------------------------------------------------

/** Rutas de episodio seguras para el enlace de vuelta `?desde=`: ver `rutaLibrosSegura`. */
export function hrefEpisodioDesdeLibro(lang: string, episodioId: string, rutaLector: string): string {
  const idioma = /^[a-z]{2}$/.test(lang) ? lang : "es";
  const base = `/${idioma}/episodio/${episodioId}`;
  return EPISODIO_VALIDO.test(episodioId) && RUTA_LIBROS.test(rutaLector) ? `${base}?desde=${encodeURIComponent(rutaLector)}` : base;
}

/** Solo `1` o `true` encienden el flag. Cualquier otra cosa lo deja apagado. */
export function afirmativo(valor: string | null | undefined): boolean {
  const limpio = (valor ?? "").trim().toLowerCase();
  return limpio === "1" || limpio === "true";
}

/** Solo fichas https de Amazon. Nada más sale hacia fuera. */
export function urlAmazonSegura(valor: unknown): string | null {
  if (typeof valor !== "string" || valor.length > 300) return null;
  try {
    const url = new URL(valor);
    if (url.protocol !== "https:") return null;
    return /(^|\.)amazon\.[a-z.]{2,6}$/.test(url.hostname) || url.hostname === "amzn.to" || url.hostname === "a.co" ? url.toString() : null;
  } catch {
    return null;
  }
}

/** `/[lang]/libros` y subrutas, con una consulta mínima `c` y `b` (capítulo y bloque). Sin `//`, `://` ni `..`. */
export const RUTA_LIBROS = /^\/[a-z]{2}\/libros(?:\/[a-z0-9][a-z0-9-]{0,80}){0,2}(?:\?[cb]=[a-zA-Z0-9-]{1,80}(?:&[cb]=[a-zA-Z0-9-]{1,80})?)?$/;

export function rutaLibrosSegura(valor: unknown): string | null {
  if (typeof valor !== "string" || valor.length > 200) return null;
  if (valor.includes("//") || valor.includes("://") || valor.includes("..") || valor.includes("\\")) return null;
  return RUTA_LIBROS.test(valor) ? valor : null;
}

export const MENSAJES_LIBROS = {
  preparandose: "La lectura de este volumen en Audite se está preparando.",
  enPreparacion: "En preparación",
  audiolibro: "El audiolibro llegará a Audite.",
} as const;

/** Frase que contiene la posición `pos` del texto de un bloque. Sirve al subrayado táctil de la app. */
export function rangoDeFrase(texto: string, pos: number): { inicio: number; fin: number } {
  const punto = Math.max(0, Math.min(pos, texto.length - 1));
  let inicio = 0;
  for (let i = punto - 1; i >= 0; i -= 1) {
    if (/[.!?…]/.test(texto[i] ?? "") && /\s/.test(texto[i + 1] ?? "")) {
      inicio = i + 1;
      break;
    }
  }
  while (inicio < punto && /\s/.test(texto[inicio] ?? "")) inicio += 1;
  let fin = texto.length;
  for (let i = punto; i < texto.length; i += 1) {
    if (/[.!?…]/.test(texto[i] ?? "") && (i + 1 >= texto.length || /[\s)»"”]/.test(texto[i + 1] ?? ""))) {
      fin = i + 1;
      break;
    }
  }
  return { inicio, fin };
}
