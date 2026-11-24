/** Fila del rótulo «Ahora suena», con los botones de cerrar e información. */
export const ALTO_FILA_ROTULO = 48;
/** Separación entre el área segura y la fila del rótulo. */
export const MARGEN_SOBRE_ROTULO = 8;
/** Separación entre el rótulo y el carrusel, para que la imagen no corte las letras. */
export const MARGEN_BAJO_ROTULO = 12;
/** Padding inferior del bloque de controles, sin el área segura. */
export const MARGEN_BAJO_CONTROLES = 12;

/**
 * Título a dos líneas, ficha de camino, scrubber con relojes, botón de 80 y chips de 44,
 * con 16 px entre cada bloque.
 */
export const ALTO_CONTROLES_REPRODUCTOR = 16 + 92 + 16 + 56 + 16 + 62 + 16 + 80 + 16 + 44;

export type VentanaReproductor = {
  height: number;
  top: number;
  bottom: number;
};

/** Alto de la cabecera, con el área segura, la fila del rótulo y el margen bajo el texto. */
export function altoCabeceraAhora(top: number): number {
  return top + MARGEN_SOBRE_ROTULO + ALTO_FILA_ROTULO + MARGEN_BAJO_ROTULO;
}

/** Alto reservado bajo el carrusel, con los controles y el área segura inferior. */
export function altoControlesAhora(bottom: number): number {
  return ALTO_CONTROLES_REPRODUCTOR + MARGEN_BAJO_CONTROLES + bottom;
}

/** Alto máximo del carrusel para que quede entero bajo el rótulo, sin invadirlo. */
export function altoMaxCarrusel({ height, top, bottom }: VentanaReproductor): number {
  return Math.max(0, height - altoCabeceraAhora(top) - altoControlesAhora(bottom));
}
