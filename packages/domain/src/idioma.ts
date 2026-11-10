export const IDIOMAS = ["es", "en", "it", "pt", "fr", "de", "zh"] as const;
export type Idioma = (typeof IDIOMAS)[number];

export function esIdioma(valor: string | null | undefined): valor is Idioma {
  return typeof valor === "string" && (IDIOMAS as readonly string[]).includes(valor);
}

/** zh-* → zh, pt-BR → pt. Sin IP. */
export function idiomaDeEtiqueta(etiqueta: string | null | undefined): Idioma | null {
  if (!etiqueta) return null;
  const limpio = etiqueta.trim().toLowerCase().replace(/_/g, "-");
  if (!limpio || limpio === "*") return null;
  if (limpio === "zh" || limpio.startsWith("zh-")) return "zh";
  const base = limpio.split("-")[0] ?? "";
  return esIdioma(base) ? base : null;
}

export function etiquetasDeCabecera(cabecera: string | null | undefined): string[] {
  if (!cabecera) return [];
  return cabecera
    .split(",")
    .map((parte) => {
      const [etiqueta, ...params] = parte.trim().split(";");
      const calidad = params.map((param) => param.trim()).find((param) => param.startsWith("q="));
      const peso = calidad ? Number(calidad.slice(2)) : 1;
      return { etiqueta: etiqueta?.trim() ?? "", peso: Number.isFinite(peso) ? peso : 0 };
    })
    .filter((item) => item.etiqueta.length > 0 && item.etiqueta !== "*")
    .sort((a, b) => b.peso - a.peso)
    .map((item) => item.etiqueta);
}

export function idiomaDeLista(etiquetas: readonly string[] | null | undefined): Idioma {
  for (const etiqueta of etiquetas ?? []) {
    const idioma = idiomaDeEtiqueta(etiqueta);
    if (idioma) return idioma;
  }
  return "es";
}

/** La elección guardada prevalece sobre la detección. */
export function idiomaResuelto(guardado: string | null | undefined, etiquetas: readonly string[] | null | undefined): Idioma {
  return idiomaDeEtiqueta(guardado) ?? idiomaDeLista(etiquetas);
}

/** El texto bíblico y los rótulos de obra no se traducen: en, o es. */
export function idiomaContenido(idioma: string | null | undefined): "es" | "en" {
  return idioma === "en" ? "en" : "es";
}
