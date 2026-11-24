/**
 * Landing pública de cada libro: textos fijos, metadatos y datos estructurados.
 * Lógica pura, sin disco ni React. Solo usa datos de catálogo y de estantería, nunca texto de capítulos.
 */
import type { Metadata } from "next";
import {
  ETIQUETAS_FICHA,
  PRECIO,
  archivoPortada,
  textoLimpio,
  type AccionFicha,
  type BotonFicha,
  type Disponibilidad,
  type EntradaIndice,
  type EpisodioDeLibro,
  type LibroFicha,
  type VolumenEstanteria,
} from "@audite/domain";

export type IdiomaUi = "es" | "en";

export const AUTOR_LIBROS = "E. Brisa";
export const SITIO = "Audite";
export const MAX_REFERENCIAS_VISIBLES = 8;

export function idiomaUi(lang: string): IdiomaUi {
  return lang === "en" ? "en" : "es";
}

const DIAS = PRECIO.pruebaDias;

/** Cadenas fijas de la landing. Un test comprueba que no llevan `;`, `—` ni `–`. */
export const TEXTOS_LANDING = {
  es: {
    libros: "Libros",
    migas: "Ruta de navegación",
    volumen: (n: number) => `Volumen ${n}`,
    enPreparacion: "En preparación",
    resumen: "Resumen",
    suscripcionTitulo: "Lee el libro entero con Audite",
    suscripcionTexto: `El prólogo de cada libro es gratis. Con la suscripción lees todos los libros completos y la prueba dura ${DIAS} días.`,
    cierreTitulo: "Empieza por el prólogo",
    cierreTexto: `El prólogo es gratis y la prueba de la suscripción dura ${DIAS} días.`,
    indice: "Índice",
    indiceBorrador: "El índice llegará con el volumen.",
    adelanto: "Adelanto gratis",
    conSuscripcion: "Con suscripción",
    referencias: "Referencias",
    referenciasIntro: "Los episodios de Audite que acompañan este libro.",
    cruzados: "Otros episodios relacionados",
    verTodas: (resto: number) => `Ver las ${resto} referencias restantes`,
    portada: "Portada: ",
    audiolibro: "Audiolibro",
    audiolibroAviso: "El audiolibro llegará a Audite.",
    contenidoEs: "Los libros de Audite están escritos en español.",
    preparandose: "La lectura de este volumen en Audite se está preparando.",
    avisoBorrador: "Este volumen está en preparación. Aquí podrás leerlo cuando esté listo.",
    ruta: "Ruta de navegación",
    coleccion: "Colección Audite",
    capitulos: (n: number) => (n === 1 ? "1 capítulo" : `${n} capítulos`),
    bloqueAcceso: "Cómo leer este libro",
  },
  en: {
    libros: "Books",
    migas: "Breadcrumb",
    volumen: (n: number) => `Volume ${n}`,
    enPreparacion: "In preparation",
    resumen: "Summary",
    suscripcionTitulo: "Read the whole book with Audite",
    suscripcionTexto: `The prologue of each book is free. With a subscription you read every book in full and the trial lasts ${DIAS} days.`,
    cierreTitulo: "Start with the prologue",
    cierreTexto: `The prologue is free and the subscription trial lasts ${DIAS} days.`,
    indice: "Contents",
    indiceBorrador: "The contents will arrive with the volume.",
    adelanto: "Free preview",
    conSuscripcion: "With subscription",
    referencias: "References",
    referenciasIntro: "The Audite episodes that go with this book.",
    cruzados: "Other related episodes",
    verTodas: (resto: number) => `Show the other ${resto} references`,
    portada: "Cover: ",
    audiolibro: "Audiobook",
    audiolibroAviso: "The audiobook is coming to Audite.",
    contenidoEs: "Audite books are written in Spanish.",
    preparandose: "Reading this volume in Audite is being prepared.",
    avisoBorrador: "This volume is in preparation. You will be able to read it here when it is ready.",
    ruta: "Breadcrumb",
    coleccion: "Audite collection",
    capitulos: (n: number) => (n === 1 ? "1 chapter" : `${n} chapters`),
    bloqueAcceso: "How to read this book",
  },
} as const;

/** Etiquetas de los botones en inglés. La clave es la etiqueta en español de `ETIQUETAS_FICHA`. */
const BOTONES_EN: Record<string, string> = {
  [ETIQUETAS_FICHA.adelanto]: "Read the preview",
  [ETIQUETAS_FICHA.leer]: "Read",
  [ETIQUETAS_FICHA.seguir]: "Keep reading",
  [ETIQUETAS_FICHA.prueba]: `Try ${DIAS} days free`,
  [ETIQUETAS_FICHA.premium]: "Go premium",
  [ETIQUETAS_FICHA.entrar]: "Sign in",
};

export function etiquetaBoton(boton: Pick<BotonFicha, "etiqueta">, ui: IdiomaUi): string {
  return ui === "en" ? (BOTONES_EN[boton.etiqueta] ?? boton.etiqueta) : boton.etiqueta;
}

export function destinoAccion(accion: AccionFicha, lang: string, id: string, hrefEntrar: string, mock: string | null): string {
  if (accion === "leer") return `/${lang}/libros/${id}/leer${mock ? `?mock=${mock}` : ""}`;
  if (accion === "entrar") return hrefEntrar;
  return `/${lang}/membresia`;
}

/** Etiqueta de un episodio de referencia sin rayas ni punto y coma. */
export function etiquetaReferencia(episodio: Pick<EpisodioDeLibro, "etiqueta" | "titulo">): string {
  return textoLimpio(episodio.etiqueta) || textoLimpio(episodio.titulo);
}

/** Reparte una lista en los primeros visibles y el resto, que va en un `details`. */
export function repartirReferencias<T>(lista: readonly T[], max = MAX_REFERENCIAS_VISIBLES): { visibles: T[]; resto: T[] } {
  return { visibles: lista.slice(0, max), resto: lista.slice(max) };
}

export function marcaIndice(entrada: Pick<EntradaIndice, "es_adelanto">, ui: IdiomaUi): { texto: string; adelanto: boolean } {
  const t = TEXTOS_LANDING[ui];
  return entrada.es_adelanto ? { texto: t.adelanto, adelanto: true } : { texto: t.conSuscripcion, adelanto: false };
}

// ---------------------------------------------------------------------------------------------
// Metadatos
// ---------------------------------------------------------------------------------------------

export type DatosLanding = {
  ficha: Pick<LibroFicha, "id" | "titulo" | "subtitulo" | "libro_biblico" | "volumen" | "disponibilidad">;
  /** Datos de la estantería. `null` si no hay archivo: entonces no hay portada ni sinopsis. */
  volumen: Pick<VolumenEstanteria, "volumen" | "sinopsis" | "rotulo" | "credito_obra"> | null;
};

export function rutaPortada(volumen: number, ancho: 480 | 960, formato: "webp" | "avif" = "webp"): string {
  return `/api/libros/portada/${archivoPortada("cubierta", volumen, formato, ancho)}`;
}

export function titularSeo(titulo: string, libro: string, ui: IdiomaUi): string {
  const con = ui === "en" ? "with the Fathers" : "con los Padres";
  const candidatos = [`${titulo} · ${libro} ${con} | ${SITIO}`, `${titulo} · ${libro} | ${SITIO}`, `${titulo} | ${SITIO}`];
  return candidatos.find((c) => c.length <= 60) ?? candidatos[2]!;
}

function recortarPalabra(texto: string, max: number): string {
  if (texto.length <= max) return texto;
  const corte = texto.slice(0, max - 1);
  const espacio = corte.lastIndexOf(" ");
  return `${(espacio > 40 ? corte.slice(0, espacio) : corte).replace(/[,.:\s]+$/, "")}…`;
}

/** Resumen más la oferta de la prueba, de 140 a 160 caracteres cuando el resumen lo permite. */
export function descripcionSeo(resumen: string, ui: IdiomaUi, respaldo: string): string {
  const base = textoLimpio(resumen) || textoLimpio(respaldo);
  const ofertas =
    ui === "en"
      ? [`Free prologue. Try ${DIAS} days free.`, `Free prologue and a ${DIAS} day trial.`, `Try ${DIAS} days free.`]
      : [`Prólogo gratis. Prueba ${DIAS} días gratis.`, `Prueba ${DIAS} días gratis.`];
  const frases = base.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g)?.map((f) => f.trim()) ?? [base];
  let mejor = "";
  for (const oferta of ofertas) {
    const presupuesto = 160 - oferta.length - 1;
    let cuerpo = "";
    for (const frase of frases) {
      const siguiente = cuerpo ? `${cuerpo} ${frase}` : frase;
      if (siguiente.length > presupuesto) break;
      cuerpo = siguiente;
    }
    if (!cuerpo) cuerpo = recortarPalabra(base, presupuesto);
    const total = `${cuerpo} ${oferta}`;
    if (total.length >= 140 && total.length <= 160) return total;
    if (total.length <= 160 && total.length > mejor.length) mejor = total;
  }
  return mejor;
}

export function urlLanding(origen: string, lang: string, id: string): string {
  return `${origen}/${lang}/libros/${id}`;
}

export function metadatosLanding({ ficha, volumen }: DatosLanding, lang: string, origen: string): Metadata {
  const ui = idiomaUi(lang);
  const titulo = titularSeo(textoLimpio(ficha.titulo), textoLimpio(ficha.libro_biblico), ui);
  const descripcion = descripcionSeo(volumen?.sinopsis ?? "", ui, ficha.subtitulo);
  const url = urlLanding(origen, lang, ficha.id);
  const imagen = volumen ? `${origen}${rutaPortada(volumen.volumen, 960)}` : null;
  const alt = `${ui === "en" ? "Cover of" : "Cubierta de"} «${ficha.titulo}»`;
  const indexable = ficha.disponibilidad === "lectura";
  return {
    title: { absolute: titulo },
    description: descripcion,
    alternates: {
      canonical: url,
      languages: { es: urlLanding(origen, "es", ficha.id), en: urlLanding(origen, "en", ficha.id), "x-default": urlLanding(origen, "es", ficha.id) },
    },
    robots: indexable ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: {
      type: "book",
      title: titulo,
      description: descripcion,
      url,
      locale: ui === "en" ? "en_US" : "es_ES",
      siteName: SITIO,
      authors: [AUTOR_LIBROS],
      ...(imagen ? { images: [{ url: imagen, width: 960, height: 1440, alt }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: titulo,
      description: descripcion,
      ...(imagen ? { images: [{ url: imagen, alt }] } : {}),
    },
  };
}

export function metadatosCatalogo(lang: string, origen: string, hayPortada: boolean): Metadata {
  const ui = idiomaUi(lang);
  const titulo = ui === "en" ? "The Bible, book by book | Audite" : "La Biblia, libro a libro | Audite";
  const descripcion =
    ui === "en"
      ? `A volume for each book of the Bible, with commentary from the Fathers of the Church. Read the prologue free and try ${DIAS} days free.`
      : `Un volumen por cada libro de la Biblia, comentado con los Padres de la Iglesia. Prólogo gratis y prueba de ${DIAS} días.`;
  const url = `${origen}/${lang}/libros`;
  const imagen = hayPortada ? `${origen}${rutaPortada(1, 960)}` : null;
  const alt = ui === "en" ? "Cover of volume 1 of the Audite books" : "Cubierta del volumen 1 de los libros de Audite";
  return {
    title: { absolute: titulo },
    description: descripcion,
    alternates: { canonical: url, languages: { es: `${origen}/es/libros`, en: `${origen}/en/libros`, "x-default": `${origen}/es/libros` } },
    openGraph: {
      type: "website",
      title: titulo,
      description: descripcion,
      url,
      locale: ui === "en" ? "en_US" : "es_ES",
      siteName: SITIO,
      ...(imagen ? { images: [{ url: imagen, width: 960, height: 1440, alt }] } : {}),
    },
    twitter: { card: "summary_large_image", title: titulo, description: descripcion, ...(imagen ? { images: [{ url: imagen, alt }] } : {}) },
  };
}

/** JSON-LD `Book`. Solo catálogo y resumen: ningún texto de capítulos. */
export function jsonLdLibro({ ficha, volumen }: DatosLanding, lang: string, origen: string, indice: readonly EntradaIndice[]): Record<string, unknown> {
  const prologo = indice.find((e) => e.tipo === "prologo" && e.es_adelanto);
  const lectura = ficha.disponibilidad === "lectura";
  const url = urlLanding(origen, lang, ficha.id);
  return {
    "@context": "https://schema.org",
    "@type": "Book",
    "@id": `${url}#libro`,
    name: textoLimpio(ficha.titulo),
    ...(ficha.subtitulo ? { alternativeHeadline: textoLimpio(ficha.subtitulo) } : {}),
    author: { "@type": "Person", name: AUTOR_LIBROS },
    inLanguage: "es",
    url,
    description: descripcionSeo(volumen?.sinopsis ?? "", idiomaUi(lang), ficha.subtitulo),
    ...(volumen ? { image: `${origen}${rutaPortada(volumen.volumen, 960)}` } : {}),
    publisher: { "@type": "Organization", name: SITIO },
    isAccessibleForFree: false,
    ...(lectura && prologo
      ? { hasPart: { "@type": "WebPageElement", name: textoLimpio(prologo.titulo), isAccessibleForFree: true, url: `${origen}/${lang}/libros/${ficha.id}/leer` } }
      : {}),
  };
}

export function serializarJsonLd(datos: Record<string, unknown>): string {
  return JSON.stringify(datos).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
}

/** La landing sale en el sitemap solo si el libro se puede leer. */
export function entraEnSitemap(disponibilidad: Disponibilidad): boolean {
  return disponibilidad === "lectura";
}
