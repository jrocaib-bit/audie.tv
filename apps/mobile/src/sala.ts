import { obraDeEpisodio, obraEnPantalla, obraWebp, type ObraVisible } from "../../../packages/content/src/obras-visibles";

export const EPISODIO_SALA_DEFECTO = "gn-01";
export const ZOOM_MIN = 1;
export const ZOOM_MAX = 4;
export const ZOOM_DOBLE_TOQUE = 2.2;

export type AvanceEpisodioSala = {
  positionSeconds: number;
  updatedAt?: string;
  completed: boolean;
};

export type EntradaSeleccionSala = {
  currentEpisodeId: string | null;
  jugando: boolean;
  cargadoId: string | null;
  tieneActualGuardado: boolean;
  episodes: Record<string, AvanceEpisodioSala | undefined>;
  validos?: readonly string[];
  defectoId?: string;
};

export type ResultadoSeleccionSala = {
  episodioId: string;
  /** True cuando no hay episodio en el reproductor ni historial previo y se ofrece gn-01 para empezar. */
  sinEpisodio: boolean;
};

function tieneAvance(a: AvanceEpisodioSala | undefined): boolean {
  return Boolean(a && (a.completed || a.positionSeconds > 0));
}

/**
 * Elige qué episodio protagoniza «La sala»:
 * 1) El episodio actual del reproductor si está sonando, cargado, guardado o tiene avance.
 * 2) Si no, el último escuchado según `updatedAt`.
 * 3) Si no hay ninguno, `gn-01` con invitación a escuchar.
 */
export function seleccionarObraSala(entrada: EntradaSeleccionSala): ResultadoSeleccionSala {
  const defecto = entrada.defectoId ?? EPISODIO_SALA_DEFECTO;
  const actual = entrada.currentEpisodeId?.trim() || null;
  const esValido = (id: string) => !entrada.validos || entrada.validos.includes(id);

  if (actual && esValido(actual)) {
    const activo =
      entrada.jugando ||
      entrada.cargadoId === actual ||
      entrada.tieneActualGuardado ||
      actual !== defecto ||
      tieneAvance(entrada.episodes[actual]);
    if (activo) return { episodioId: actual, sinEpisodio: false };
  }

  let ultimo: { id: string; en: string } | null = null;
  for (const [id, avance] of Object.entries(entrada.episodes)) {
    if (!esValido(id) || !tieneAvance(avance)) continue;
    const en = avance?.updatedAt ?? "";
    if (!ultimo || en > ultimo.en) ultimo = { id, en };
  }
  if (ultimo) return { episodioId: ultimo.id, sinEpisodio: false };

  return { episodioId: defecto, sinEpisodio: true };
}

export type FichaMuseo = {
  episodioId: string;
  src: string;
  ratio: number;
  titulo: string;
  autor: string;
  fecha: string;
  ubicacion: string;
  alt: string;
};

export type ArtworkCatalogo = {
  title?: { es?: string; en?: string };
  artist?: { es?: string; en?: string };
  date?: string;
  location?: { es?: string; en?: string };
  publicPath?: string;
  width?: number;
  height?: number;
};

function limpio(valor: unknown): string {
  if (typeof valor !== "string") return "";
  const texto = valor.trim();
  if (!texto || /PENDIENTE/i.test(texto)) return "";
  return texto;
}

function textoIdioma(valor: { es?: string; en?: string } | undefined, lang: "es" | "en"): string {
  return limpio(valor?.[lang]) || limpio(valor?.es);
}

/**
 * Extrae los datos reales de cartela de museo sin inventar campos faltantes.
 * Si falta autor, fecha o museo/lugar, devuelve cadena vacía para omitirlo en pantalla.
 */
export function fichaMuseoObra(
  episodioId: string,
  lang: "es" | "en" = "es",
  fallbackCatalogo?: ArtworkCatalogo | null,
  resolverObra: (id: string) => ObraVisible | null = (id) => obraEnPantalla(id) ?? obraDeEpisodio(id),
): FichaMuseo {
  const obra = resolverObra(episodioId);
  const titulo = textoIdioma(obra?.titulo, lang) || textoIdioma(fallbackCatalogo?.title, lang);
  const autor = textoIdioma(obra?.autor, lang) || textoIdioma(fallbackCatalogo?.artist, lang);
  const fecha = limpio(obra?.fecha) || limpio(fallbackCatalogo?.date);
  const ubicacion = textoIdioma(obra?.ubicacion, lang) || textoIdioma(fallbackCatalogo?.location, lang);
  const src = limpio(fallbackCatalogo?.publicPath) || (obra ? obraWebp(obra) : "");

  const ancho = fallbackCatalogo?.width && fallbackCatalogo.width > 0 ? fallbackCatalogo.width : obra?.ancho ?? 0;
  const alto = fallbackCatalogo?.height && fallbackCatalogo.height > 0 ? fallbackCatalogo.height : obra?.alto ?? 0;
  const ratio = ancho > 0 && alto > 0 ? ancho / alto : 16 / 9;

  return {
    episodioId,
    src,
    ratio,
    titulo,
    autor,
    fecha,
    ubicacion,
    alt: [titulo, autor].filter(Boolean).join(". "),
  };
}

/** Calcula el tamaño exacto de la obra entera manteniendo su proporción original sin recortar. */
export function tamanoObraSala(ratio: number, maxAncho: number, maxAlto: number): { width: number; height: number } {
  const r = Number.isFinite(ratio) && ratio > 0 ? ratio : 16 / 9;
  const anchoTope = Math.max(0, maxAncho);
  const altoTope = Math.max(0, maxAlto);
  if (anchoTope === 0 || altoTope === 0) return { width: 0, height: 0 };
  let width = anchoTope;
  let height = width / r;
  if (height > altoTope) {
    height = altoTope;
    width = height * r;
  }
  return { width: Math.round(width), height: Math.round(height) };
}

export function limitarZoom(escala: number): number {
  if (!Number.isFinite(escala)) return ZOOM_MIN;
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, escala));
}

export function limitarDesplazamiento(
  dx: number,
  dy: number,
  escala: number,
  ancho: number,
  alto: number,
): { x: number; y: number } {
  const z = limitarZoom(escala);
  const maxX = Math.max(0, ((z - 1) * Math.max(0, ancho)) / 2);
  const maxY = Math.max(0, ((z - 1) * Math.max(0, alto)) / 2);
  return {
    x: Math.min(maxX, Math.max(-maxX, Number.isFinite(dx) ? dx : 0)) || 0,
    y: Math.min(maxY, Math.max(-maxY, Number.isFinite(dy) ? dy : 0)) || 0,
  };
}
