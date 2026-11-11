/** Precio decidido. Visible. No hay cobro conectado. */
export const PRECIO = {
  pruebaDias: 7,
  mes: "1,99 €",
  anio: "8,00 €",
} as const;

export const ETIQUETA_LANZAMIENTO = "Precio de lanzamiento hasta el 5 de enero";

/** Desde el 6 de enero de 2027, para una suscripción anual nueva. */
export const PRECIO_ANUAL_SIGUIENTE = "12,99 €";
export const PRECIO_MES_TEXTO = "1,99 € al mes";
export const PRECIO_ANIO_TEXTO = "8,00 € al año";
export const PRECIO_ANIO_SIGUIENTE_TEXTO = "12,99 € al año";

export type TipoAnual = "nuevo" | "vigente";

function calendarioMadrid(fecha: Date): { y: number; m: number; d: number } {
  const partes = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(fecha);
  const leer = (tipo: Intl.DateTimeFormatPartTypes) => Number(partes.find((parte) => parte.type === tipo)?.value);
  return { y: leer("year"), m: leer("month"), d: leer("day") };
}

/** Antes del 6 de enero de 2027, 00:00 Europe/Madrid. */
export function anualDeLanzamiento(cuando: Date): boolean {
  const dia = calendarioMadrid(cuando);
  if (dia.y !== 2027) return dia.y < 2027;
  if (dia.m !== 1) return dia.m < 1;
  return dia.d < 6;
}

export function precioDeSuscripcion(plan: "mensual" | "anual", cuando: Date, tipo: TipoAnual = "nuevo"): string {
  if (plan === "mensual") return PRECIO_MES_TEXTO;
  if (tipo === "vigente" || anualDeLanzamiento(cuando)) return PRECIO_ANIO_TEXTO;
  return PRECIO_ANIO_SIGUIENTE_TEXTO;
}

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
