/** Precio decidido. Visible. No hay cobro conectado. */
export const PRECIO = {
  pruebaDias: 7,
  mes: "1,99 €",
  anio: "8,00 €",
} as const;

export const ETIQUETA_LANZAMIENTO = "Precio de lanzamiento hasta el 5 de enero";

/** Desde el 6 de enero, para quien se suscribe por primera vez. */
export const PRECIO_ANUAL_SIGUIENTE = "12,99 €";

/** Apagado salvo que el entorno diga exactamente "true". */
export function precioLanzamientoActivo(valor: string | undefined = process.env.PRECIO_LANZAMIENTO ?? process.env.EXPO_PUBLIC_PRECIO_LANZAMIENTO): boolean {
  return valor === "true";
}

export function etiquetaDeLanzamiento(lang: "es" | "en", activo = precioLanzamientoActivo()): string | null {
  if (!activo) return null;
  return lang === "en" ? "Launch price until 5 January" : ETIQUETA_LANZAMIENTO;
}

/** El reto de Adviento no pide suscripción. */
export function pideSuscripcion(retoId: string | null | undefined): boolean {
  return retoId !== "adviento-isaias";
}
