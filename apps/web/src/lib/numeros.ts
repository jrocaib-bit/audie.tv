import type { UiLocale } from "@audite/domain";

export function formatoNumero(locale: UiLocale, valor: number, decimales?: number): string {
  return new Intl.NumberFormat(locale === "en" ? "en-US" : "es-ES", {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales ?? 2,
  }).format(valor);
}
