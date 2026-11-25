/** Textos de la portada de Libros. Frases afirmativas, sin punto y coma ni rayas. */
export const TITULO_SECCION_LIBROS = {
  es: "La Biblia comentada",
  en: "The Bible with commentary",
} as const;

export const SUBTITULO_SECCION_LIBROS = {
  es: "De la mano de los Padres de la Iglesia, los santos y los grandes teólogos",
  en: "Guided by the Fathers of the Church, the saints and the great theologians",
} as const;

export function tituloSeoCatalogo(ui: "es" | "en"): string {
  return `${TITULO_SECCION_LIBROS[ui]} | Audite`;
}

export function descripcionSeoCatalogo(ui: "es" | "en", dias: number): string {
  return ui === "en"
    ? `Bible commentary from the Fathers of the Church, the saints and the great theologians. Free prologue and a trial of ${dias} days.`
    : `La Biblia comentada de la mano de los Padres de la Iglesia, los santos y los grandes teólogos. Prólogo gratis y prueba de ${dias} días.`;
}
