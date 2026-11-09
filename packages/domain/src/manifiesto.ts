export const ESTADOS_IDIOMA = ["pendiente", "borrador", "listo_voz", "audio_listo", "video_listo", "bloqueado"] as const;
export type EstadoIdioma = (typeof ESTADOS_IDIOMA)[number];

export type Textos = { es?: string; en?: string; [codigo: string]: string | undefined };

export type ArteManifiesto = {
  archivo?: string;
  titulo?: Textos;
  autor?: string;
  anio?: string;
  ubicacion?: string;
  derechos?: string;
  fuente?: string;
  ancho?: number;
  alto?: number;
  inicio_s?: number;
  fin_s?: number;
  nota?: string;
};

export type IdiomaManifiesto = {
  estado: EstadoIdioma;
  master?: string;
  duracion_s?: number;
  subtitulos?: string;
  nota?: string;
};

export type EpisodioManifiesto = {
  id: string;
  orden: number;
  capitulos?: string;
  propuesta?: boolean;
  rango?: string;
  duracion_estimada_s?: number;
  pendientes?: string[];
  etiqueta?: Textos;
  titulo?: Textos;
  titulo_corto?: Textos;
  resumen?: Textos;
  arte?: ArteManifiesto[];
  idiomas: Record<string, IdiomaManifiesto>;
};

export type LibroManifiesto = {
  id: string;
  orden: number;
  testamento: "AT" | "NT";
  deuterocanonico?: boolean;
  capitulos_total?: number;
  titulo?: Textos;
  episodios: EpisodioManifiesto[];
};

export type Manifiesto = {
  version: 1;
  actualizado: string;
  idiomas: string[];
  fuente_texto?: Textos;
  libros: LibroManifiesto[];
};

export function rutaSegura(ruta: string | undefined): boolean {
  if (!ruta) return false;
  if (ruta.startsWith("/") || ruta.includes("..") || ruta.includes("\\")) return false;
  return true;
}

export function idiomaReproducible(idioma: IdiomaManifiesto | undefined, masterExiste: boolean): boolean {
  if (!idioma) return false;
  if (idioma.estado !== "audio_listo") return false;
  if (!rutaSegura(idioma.master)) return false;
  if (idioma.duracion_s == null || idioma.duracion_s <= 0) return false;
  return masterExiste;
}

export function textoOPendiente(valor: string | undefined, pendiente: string): string {
  return valor && valor.trim().length > 0 ? valor : pendiente;
}

/** Comprueba la forma de un id que ya existe. No rellena huecos: si falta sal-010, no se crea. */
export function idEpisodioValido(libroId: string, episodioId: string): boolean {
  if (libroId === "sal") return /^sal-(?!000)\d{3}$/.test(episodioId);
  return new RegExp(`^${libroId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}-\\d{2}$`).test(episodioId);
}

type Nombres = {
  id: string;
  title?: string | null;
  titulo?: Textos | { es?: string | null; en?: string | null } | null;
  tituloCorto?: Textos | { es?: string | null; en?: string | null } | null;
  titulo_corto?: Textos | { es?: string | null; en?: string | null } | null;
  etiqueta?: Textos | { es?: string | null; en?: string | null } | null;
};

function limpio(valor: string | null | undefined): string | null {
  const texto = valor?.trim();
  return texto ? texto : null;
}

export function nombreEpisodio(episodio: Nombres, lang: "es" | "en"): string {
  return limpio(episodio.titulo?.[lang]) ?? limpio(episodio.etiqueta?.[lang]) ?? limpio(episodio.title) ?? episodio.id;
}

export function rotuloEpisodio(episodio: Nombres, lang: "es" | "en"): string | null {
  return limpio(episodio.tituloCorto?.[lang]) ?? limpio(episodio.titulo_corto?.[lang]) ?? limpio(episodio.titulo?.[lang]) ?? limpio(episodio.etiqueta?.[lang]);
}

export function nombreCorto(episodio: Nombres, lang: "es" | "en"): string {
  return rotuloEpisodio(episodio, lang) ?? episodio.id;
}

export function creditoTexto(fuente: Textos | undefined, lang: "es" | "en"): string | null {
  return limpio(fuente?.[lang]);
}

/** The credit is shown once. If the text already names itself, no second label is added. */
export function creditoVisible(fuente: string | null | undefined, etiqueta: string, pendiente: string): string {
  const texto = fuente?.trim();
  if (!texto) return pendiente;
  if (/:\s/.test(texto) || /^(texto|text)\b/i.test(texto)) return texto;
  return `${etiqueta}: ${texto}`;
}

export type PresentacionEpisodio = "revision" | "preparacion";

export function presentacionEpisodio(episodio: EpisodioManifiesto): PresentacionEpisodio {
  const idioma = episodio.idiomas.es ?? Object.values(episodio.idiomas)[0];
  return idioma?.estado === "bloqueado" ? "revision" : "preparacion";
}

export function idsEnOrden(episodios: readonly { id: string; orden: number }[]): string[] {
  return episodios.slice().sort((a, b) => a.orden - b.orden || a.id.localeCompare(b.id)).map((episodio) => episodio.id);
}
