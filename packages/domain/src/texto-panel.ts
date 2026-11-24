/**
 * Panel de texto del reproductor. Lógica pura compartida por la web y la app.
 *
 * El texto real nunca vive en el repositorio. Llega por `/api/texto/<id>` desde un almacén privado.
 */

export const ID_TEXTO = /^[a-z0-9-]{2,24}$/;
/** Fracción mínima de versículos con `t` para considerar el panel sincronizado. */
export const UMBRAL_SINCRONIA = 0.8;

export type VersiculoPanel = {
  ref: string;
  cap: number;
  /** Cadena porque puede ser «5a». */
  v: string;
  texto: string;
  /** Segundo en la línea de tiempo del máster. Opcional. */
  t?: number;
};

export type TextoEpisodio = {
  version: 1;
  episodio: string;
  idioma: "es" | "en";
  muestra: boolean;
  fuente: string;
  credito: string;
  versiculos: VersiculoPanel[];
};

/** Identificador de la fuente del texto bíblico de dominio público que se sirve desde `content/texto/torres-amat`. */
export const FUENTE_TORRES_AMAT = "torres-amat";

export type MarcaTiempo = { t: number; indice: number };

export function idTextoValido(id: unknown): id is string {
  return typeof id === "string" && ID_TEXTO.test(id);
}

function tiempoValido(t: unknown): t is number {
  return typeof t === "number" && Number.isFinite(t) && t >= 0;
}

export function estaSincronizado(versiculos: readonly Pick<VersiculoPanel, "t">[]): boolean {
  if (versiculos.length === 0) return false;
  const conTiempo = versiculos.filter((versiculo) => tiempoValido(versiculo.t)).length;
  return conTiempo / versiculos.length >= UMBRAL_SINCRONIA;
}

/**
 * Marcas ordenadas por tiempo. Con tiempos repetidos gana el versículo que va después en el texto,
 * porque el anterior no llegó a durar nada.
 */
export function marcasDeTiempo(versiculos: readonly Pick<VersiculoPanel, "t">[]): MarcaTiempo[] {
  const marcas: MarcaTiempo[] = [];
  versiculos.forEach((versiculo, indice) => {
    if (tiempoValido(versiculo.t)) marcas.push({ t: versiculo.t, indice });
  });
  return marcas.sort((a, b) => a.t - b.t || a.indice - b.indice);
}

/**
 * Índice del versículo que suena en `segundo`, o -1 antes del primero o sin tiempos.
 * Búsqueda binaria sobre `marcasDeTiempo`: la última marca con `t <= segundo`.
 */
export function versiculoActual(marcas: readonly MarcaTiempo[], segundo: number): number {
  if (marcas.length === 0 || !Number.isFinite(segundo)) return -1;
  let bajo = 0;
  let alto = marcas.length - 1;
  let hallado = -1;
  while (bajo <= alto) {
    const medio = (bajo + alto) >> 1;
    if ((marcas[medio] as MarcaTiempo).t <= segundo) {
      hallado = medio;
      bajo = medio + 1;
    } else {
      alto = medio - 1;
    }
  }
  return hallado === -1 ? -1 : (marcas[hallado] as MarcaTiempo).indice;
}

/** Lectura defensiva en el cliente. El servidor ya valida con un esquema estricto. */
export function leerTextoEpisodio(valor: unknown): TextoEpisodio | null {
  if (!valor || typeof valor !== "object") return null;
  const dato = valor as Record<string, unknown>;
  if (dato.version !== 1 || !idTextoValido(dato.episodio)) return null;
  if (dato.idioma !== "es" && dato.idioma !== "en") return null;
  if (typeof dato.fuente !== "string" || typeof dato.credito !== "string" || typeof dato.muestra !== "boolean") return null;
  if (!Array.isArray(dato.versiculos)) return null;
  const versiculos: VersiculoPanel[] = [];
  for (const item of dato.versiculos as unknown[]) {
    if (!item || typeof item !== "object") return null;
    const fila = item as Record<string, unknown>;
    if (typeof fila.ref !== "string" || typeof fila.v !== "string" || typeof fila.texto !== "string" || typeof fila.cap !== "number") return null;
    versiculos.push({ ref: fila.ref, cap: fila.cap, v: fila.v, texto: fila.texto, ...(tiempoValido(fila.t) ? { t: fila.t } : {}) });
  }
  return { version: 1, episodio: dato.episodio, idioma: dato.idioma, muestra: dato.muestra, fuente: dato.fuente, credito: dato.credito, versiculos };
}

export type EstadoTexto = "cargando" | "listo" | "apagado" | "sin-texto" | "sin-sesion" | "sin-permiso" | "error";

/** Traduce la respuesta de `/api/texto/<id>` a un estado del panel. */
export function estadoDeRespuesta(estado: number, error?: unknown): Exclude<EstadoTexto, "cargando" | "listo"> {
  if (estado === 401) return "sin-sesion";
  if (estado === 403) return "sin-permiso";
  if (estado === 404) return error === "sin-texto" ? "sin-texto" : "apagado";
  return "error";
}

// ---- Preferencias de lectura --------------------------------------------------------------

export const CLAVE_TEXTO_TAMANO = "audite.texto.tamano";
export const CLAVE_TEXTO_MODO = "audite.texto.modo";
/** Cinco pasos de tamaño de letra, en px. */
export const TAMANOS_TEXTO = [17, 19, 21, 24, 28] as const;
export const TAMANO_INICIAL = 1;
export type ModoTexto = "noche" | "dia";

export function pasoTamano(actual: number, delta: -1 | 1): number {
  return Math.min(TAMANOS_TEXTO.length - 1, Math.max(0, actual + delta));
}

export function leerTamano(crudo: string | null | undefined): number {
  if (crudo == null || crudo.trim() === "") return TAMANO_INICIAL;
  const n = Number(crudo);
  return Number.isInteger(n) && n >= 0 && n < TAMANOS_TEXTO.length ? n : TAMANO_INICIAL;
}

export function leerModo(crudo: string | null | undefined): ModoTexto {
  return crudo === "dia" ? "dia" : "noche";
}

/** Colores del panel. Todos los pares de texto cumplen AA (4,5:1) sobre su fondo. */
export const PALETA_TEXTO: Record<ModoTexto, { fondo: string; tinta: string; suave: string; numero: string; actual: string; borde: string }> = {
  noche: { fondo: "#100E0C", tinta: "#F4ECE2", suave: "#B7AB9C", numero: "#C9A96E", actual: "#262019", borde: "#2E2924" },
  dia: { fondo: "#F3ECDF", tinta: "#161310", suave: "#5E564C", numero: "#7A5528", actual: "#E6DAC6", borde: "#D9CBB6" },
};

export function textosPanel(idioma: string) {
  if (idioma === "en") {
    return {
      titulo: "Text",
      region: "Episode text",
      cargando: "Loading the text",
      sinTexto: "This episode has no text yet.",
      sinSesion: "Sign in to read the text.",
      entrar: "Sign in",
      sinPermiso: "The text comes with Audite Premium.",
      prueba: "Try 7 days free",
      error: "The text could not be loaded.",
      reintentar: "Try again",
      muestra: "Sample text, not a Bible edition",
      capitulo: "Chapter",
      salmo: "Psalm",
      avisoTorresAmat: "Text: Torres Amat (public domain). It may not match the audio word for word",
      sinSincronia: "This text is not synced with the audio.",
      menos: "Smaller text",
      mas: "Larger text",
      modoDia: "Day mode",
      modoNoche: "Night mode",
      volver: "Back to the current verse",
      saltar: (v: string) => `Play from verse ${v}`,
      versiculo: "Verse",
    };
  }
  return {
    titulo: "Texto",
    region: "Texto del episodio",
    cargando: "Cargando el texto",
    sinTexto: "Este episodio todavía no tiene texto.",
    sinSesion: "Entra en tu cuenta para leer el texto.",
    entrar: "Entrar",
    sinPermiso: "El texto llega con Audite Premium.",
    prueba: "Prueba 7 días gratis",
    error: "El texto no ha cargado.",
    reintentar: "Reintentar",
    muestra: "Texto de ejemplo, no es una edición bíblica",
    capitulo: "Capítulo",
    salmo: "Salmo",
    avisoTorresAmat: "Texto: Torres Amat (dominio público). Puede no coincidir palabra por palabra con el audio",
    sinSincronia: "Este texto va sin sincronizar con el audio.",
    menos: "Letra más pequeña",
    mas: "Letra más grande",
    modoDia: "Modo día",
    modoNoche: "Modo noche",
    volver: "Volver al versículo actual",
    saltar: (v: string) => `Oír desde el versículo ${v}`,
    versiculo: "Versículo",
  };
}

/** Milisegundos que el auto-desplazamiento queda en pausa tras un scroll a mano. */
export const PAUSA_DESPLAZAMIENTO_MS = 5000;

/**
 * Aviso fijo de la fuente del texto. Solo con texto real de Torres Amat. El de muestra lleva su propio aviso
 * y cualquier otra fuente usa el crédito que trae el fichero.
 */
export function avisoFuente(texto: Pick<TextoEpisodio, "muestra" | "fuente">, tx: { avisoTorresAmat: string }): string | null {
  if (texto.muestra || texto.fuente !== FUENTE_TORRES_AMAT) return null;
  return tx.avisoTorresAmat;
}

/**
 * Título que abre cada capítulo dentro del panel («Capítulo 23», «Salmo 23»), o null si el versículo sigue en el mismo capítulo.
 * Los episodios de salmos llevan el id `sal-…`.
 */
export function marcaCapitulo(
  episodio: string,
  versiculos: readonly Pick<VersiculoPanel, "cap">[],
  indice: number,
  tx: { capitulo: string; salmo: string },
): string | null {
  const actual = versiculos[indice];
  if (!actual) return null;
  if (indice > 0 && versiculos[indice - 1]?.cap === actual.cap) return null;
  return `${episodio.startsWith("sal-") ? tx.salmo : tx.capitulo} ${actual.cap}`;
}
