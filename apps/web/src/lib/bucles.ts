import tabla from "@/data/bucles.json";

/**
 * Hueco para el bucle de cada episodio.
 * Los archivos viven fuera del repo (04_arte/animado/web/INDICE.md).
 * La clave es el id del episodio. Vacío: se queda el cuadro estático.
 */
export type BucleCrudo = {
  mp4?: string;
  webm?: string;
  poster?: string;
  mp4_1280?: string;
  webm_1280?: string;
  poster_1280?: string;
  alt?: string;
  aspect?: string;
};

export type Bucle = {
  mp4: string;
  webm: string;
  poster: string;
  mp4Movil: string;
  webmMovil: string;
  posterMovil: string;
  alt: string;
  aspect: string;
};

const CLAVES = ["mp4", "webm", "poster", "mp4_1280", "webm_1280", "poster_1280", "alt"] as const;

function texto(valor: string | undefined): string {
  return (valor ?? "").trim();
}

function filaValida(valor: unknown): BucleCrudo | null {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) return null;
  const origen = valor as Record<string, unknown>;
  const fila: BucleCrudo = {};
  for (const clave of CLAVES) {
    const campo = origen[clave];
    if (typeof campo === "string") fila[clave] = campo;
  }
  const aspecto = aspectoDe(origen.aspect);
  if (aspecto) fila.aspect = aspecto;
  return fila;
}

/** Ancho/alto. Acepta un número o una fracción «16/9». */
export function aspectoDe(valor: unknown): string {
  if (typeof valor === "number" && Number.isFinite(valor) && valor > 0) return String(valor);
  if (typeof valor !== "string") return "";
  const limpio = valor.trim().replace(/\s+/g, "");
  const fraccion = limpio.match(/^(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)$/);
  if (fraccion) {
    const ancho = Number(fraccion[1]);
    const alto = Number(fraccion[2]);
    if (ancho > 0 && alto > 0) return `${ancho}/${alto}`;
  }
  const numero = Number(limpio);
  return numero > 0 ? String(numero) : "";
}

export function relacionDeAspecto(aspect: string): number {
  const propio = aspectoDe(aspect);
  if (!propio) return 16 / 9;
  if (propio.includes("/")) {
    const [ancho, alto] = propio.split("/").map(Number);
    return ancho / alto;
  }
  return Number(propio);
}

/** Reserva el hueco de la ficha y de /ahora. En móvil el alto no pasa de 70svh. */
export function estiloDeHueco(aspect: string): { aspectRatio: string; width: string; maxHeight: string } {
  const relacion = relacionDeAspecto(aspect);
  const ratio = aspectoDe(aspect) || "16/9";
  return {
    aspectRatio: ratio,
    width: `min(100%, calc(70svh * ${relacion}))`,
    maxHeight: "70svh",
  };
}

/** El JSON de entorno pisa el del repo. Si no es un objeto válido, se ignora. */
export function fusionarBucles(base: Record<string, BucleCrudo>, crudo: string | undefined): Record<string, BucleCrudo> {
  const salida: Record<string, BucleCrudo> = { ...base };
  const plano = (crudo ?? "").trim();
  if (!plano) return salida;
  let parsed: unknown;
  try {
    parsed = JSON.parse(plano);
  } catch {
    return salida;
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return salida;
  for (const [id, valor] of Object.entries(parsed)) {
    const fila = filaValida(valor);
    if (!id.trim() || !fila) continue;
    salida[id] = { ...salida[id], ...fila };
  }
  return salida;
}

/** Acceso literal: Next solo incrusta process.env.NEXT_PUBLIC_* escrito así. */
const JSON_PUBLICO = process.env.NEXT_PUBLIC_BUCLES_JSON;

function mapa(json: string | undefined = JSON_PUBLICO): Record<string, BucleCrudo> {
  return fusionarBucles(tabla as Record<string, BucleCrudo>, json);
}

function armar(fila: BucleCrudo | undefined, alt = ""): Bucle | null {
  const mp4 = texto(fila?.mp4);
  const webm = texto(fila?.webm);
  if (!mp4 && !webm) return null;
  return {
    mp4,
    webm,
    poster: texto(fila?.poster) || texto(fila?.poster_1280),
    mp4Movil: texto(fila?.mp4_1280),
    webmMovil: texto(fila?.webm_1280),
    posterMovil: texto(fila?.poster_1280),
    alt: texto(fila?.alt) || alt,
    aspect: aspectoDe(fila?.aspect),
  };
}

export const CONSULTA_MOVIL = "(max-width: 1280px)";

export type FuenteVideo = { src: string; type: string };

/** Elige el par webm/mp4 de ese ancho. En el vídeo no va el atributo media. */
export function fuentesParaAncho(bucle: Bucle, estrecho: boolean): FuenteVideo[] {
  const tomar = (webm: string, mp4: string) => [
    webm ? { src: webm, type: "video/webm" } : null,
    mp4 ? { src: mp4, type: "video/mp4" } : null,
  ].filter((fuente): fuente is FuenteVideo => Boolean(fuente));
  const movil = tomar(bucle.webmMovil, bucle.mp4Movil);
  const escritorio = tomar(bucle.webm, bucle.mp4);
  if (estrecho && movil.length > 0) return movil;
  if (escritorio.length > 0) return escritorio;
  return movil;
}

export function bucleDeEpisodio(id: string, json?: string): Bucle | null {
  return armar(mapa(json ?? process.env.NEXT_PUBLIC_BUCLES_JSON)[id]);
}

/** Portada del reto: el sufijo de la obra (_o1, _o2) gana; si no hay, vale reto:<id>. */
export function bucleDeReto(retoId: string, obraId?: string | null, json: string | undefined = JSON_PUBLICO): Bucle | null {
  const sufijo = obraId?.match(/_(o\d+)$/)?.[1];
  if (sufijo) {
    const propio = bucleDeEpisodio(`reto:${retoId}:${sufijo}`, json);
    if (propio) return propio;
  }
  return bucleDeEpisodio(`reto:${retoId}`, json);
}

/** El hero puede sustituir el cuadro de gn-01 con variables NEXT_PUBLIC_BUCLE_HERO_*. */
export function bucleDeHero(id: string, env: Record<string, string | undefined> = process.env): Bucle | null {
  const json = Object.prototype.hasOwnProperty.call(env, "NEXT_PUBLIC_BUCLES_JSON")
    ? env["NEXT_PUBLIC_BUCLES_JSON"]
    : JSON_PUBLICO;
  const base = mapa(json)[id] ?? {};
  const mp4 = texto(env.NEXT_PUBLIC_BUCLE_HERO_MP4);
  const webm = texto(env.NEXT_PUBLIC_BUCLE_HERO_WEBM);
  const poster = texto(env.NEXT_PUBLIC_BUCLE_HERO_POSTER);
  const mp4Movil = texto(env.NEXT_PUBLIC_BUCLE_HERO_MP4_1280);
  const webmMovil = texto(env.NEXT_PUBLIC_BUCLE_HERO_WEBM_1280);
  const posterMovil = texto(env.NEXT_PUBLIC_BUCLE_HERO_POSTER_1280);
  const hayHero = Boolean(mp4 || webm || poster || mp4Movil || webmMovil || posterMovil);
  return armar({
    mp4: mp4 || base.mp4,
    webm: webm || base.webm,
    poster: poster || base.poster,
    mp4_1280: mp4Movil || base.mp4_1280,
    webm_1280: webmMovil || base.webm_1280,
    poster_1280: posterMovil || base.poster_1280,
    alt: hayHero ? texto(env.NEXT_PUBLIC_BUCLE_HERO_ALT) : base.alt,
    aspect: hayHero
      ? aspectoDe(env.NEXT_PUBLIC_BUCLE_HERO_ASPECT) || aspectoDe(mapa(json)["reto:adviento-isaias"]?.aspect)
      : "",
  });
}
