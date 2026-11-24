/**
 * Lógica pura de la ficha de la estantería de libros. Sin red, sin React, sin disco.
 * La usan la web y la app, para que los botones y las etiquetas salgan iguales en las dos.
 */
import { PRECIO } from "./precio";
import type { Disponibilidad, VistaLector } from "./libros";

export type EpisodioDestacado = { episodio_id: string; etiqueta: string; titulo: string };

/** Un volumen de la estantería, ya unido al catálogo por `id`. */
export type VolumenEstanteria = {
  volumen: number;
  id: string;
  libro: string;
  titulo: string;
  subtitulo: string;
  rotulo: string;
  color: string;
  sinopsis: string;
  credito_obra: string;
  borrador: boolean;
  episodios_total: number;
  episodios_destacados: EpisodioDestacado[];
  /** Disponibilidad real según el catálogo. */
  disponibilidad: Disponibilidad;
};

export type AccionFicha = "leer" | "prueba" | "premium" | "entrar";
export type BotonFicha = { accion: AccionFicha; etiqueta: string; nivel: "primario" | "secundario" | "enlace" };

export type OpcionesBotonesFicha = {
  /** Hay progreso de lectura guardado en este dispositivo o en la cuenta. */
  progreso?: boolean;
};

export const ETIQUETAS_FICHA = {
  adelanto: "Leer el adelanto",
  leer: "Leer",
  seguir: "Seguir leyendo",
  prueba: `Prueba ${PRECIO.pruebaDias} días gratis`,
  premium: "Hazte premium",
  entrar: "Entrar",
} as const;

/**
 * Botones de la ficha según el acceso y la disponibilidad.
 * `vista` es null mientras no se sabe el estado: solo se ofrece el adelanto, que vale para todos.
 * Sin lectura disponible (borrador o preparándose) no hay ningún botón.
 */
export function botonesFicha(vista: VistaLector | null, disponibilidad: Disponibilidad, opciones: OpcionesBotonesFicha = {}): BotonFicha[] {
  if (disponibilidad !== "lectura") return [];
  if (vista === "premium") {
    return [{ accion: "leer", etiqueta: opciones.progreso ? ETIQUETAS_FICHA.seguir : ETIQUETAS_FICHA.leer, nivel: "primario" }];
  }
  const adelanto: BotonFicha = { accion: "leer", etiqueta: ETIQUETAS_FICHA.adelanto, nivel: "primario" };
  if (vista === "gratuito") return [adelanto, { accion: "premium", etiqueta: ETIQUETAS_FICHA.premium, nivel: "secundario" }];
  if (vista === "sin-sesion") {
    return [
      adelanto,
      { accion: "prueba", etiqueta: ETIQUETAS_FICHA.prueba, nivel: "secundario" },
      { accion: "entrar", etiqueta: ETIQUETAS_FICHA.entrar, nivel: "enlace" },
    ];
  }
  return [adelanto];
}

/**
 * Texto de interfaz sin rayas ni punto y coma. «Génesis 1–2» pasa a «Génesis 1 a 2».
 * Una raya entre palabras se cambia por una coma.
 */
export function textoLimpio(valor: string): string {
  return valor
    .replace(/(\d)\s*[–—]\s*(\d)/g, "$1 a $2")
    .replace(/\s*[–—]\s*/g, ", ")
    .replace(/\s*;\s*/g, ", ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Etiqueta de un episodio para mostrarla. */
export const etiquetaLegible = textoLimpio;

/** Etiqueta accesible del lomo: «Volumen 3, Hacia las cuatro de la tarde, Juan. Abrir ficha». */
export function etiquetaLomo(volumen: Pick<VolumenEstanteria, "volumen" | "titulo" | "libro">): string {
  return `Volumen ${volumen.volumen}, ${volumen.titulo}, ${volumen.libro}. Abrir ficha`;
}

/** Texto de la cubierta para lectores de pantalla. */
export function altCubierta(volumen: Pick<VolumenEstanteria, "volumen" | "titulo">): string {
  return `Cubierta de «${volumen.titulo}», volumen ${volumen.volumen}, de la colección Audite.`;
}

export const FRASE_EN_PREPARACION = "Este volumen se está preparando. Aquí podrás leerlo cuando esté listo.";
export const LEYENDA_ESTANTERIA = "Los volúmenes 1 a 10 tienen adelanto gratis. Los volúmenes 11 a 16 están en preparación.";

/** Nombre del archivo de imagen del volumen: lomo-03.webp, cubierta-03-480.avif. */
export function archivoPortada(tipo: "lomo" | "cubierta", volumen: number, formato: "webp" | "avif", ancho?: 480 | 960): string {
  const nn = String(volumen).padStart(2, "0");
  return tipo === "lomo" ? `lomo-${nn}.${formato}` : `cubierta-${nn}-${ancho ?? 480}.${formato}`;
}
