import { FRASE_EN_PREPARACION, LEYENDA_ESTANTERIA, MENSAJES_LIBROS } from "@audite/domain";

/** Cadenas fijas de la estantería. Un test comprueba que no llevan `;`, `—` ni `–`. */
export const TEXTOS_ESTANTERIA = {
  titulo: "Estantería de libros",
  desliza: "Desliza para ver los 16 volúmenes",
  leyenda: LEYENDA_ESTANTERIA,
  cerrar: "Cerrar",
  cerrarAria: "Cerrar la ficha del libro",
  episodios: "Episodios relacionados",
  enPreparacion: MENSAJES_LIBROS.enPreparacion,
  frasePreparacion: FRASE_EN_PREPARACION,
  portada: "Portada: ",
} as const;

export function verEpisodios(total: number): string {
  return total === 1 ? "Ver el episodio del libro" : `Ver los ${total} episodios del libro`;
}
