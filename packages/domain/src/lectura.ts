export type MarcaTexto = "ficticio" | "dominio-publico";

export type VersiculoTexto = {
  capitulo: number;
  versiculo: number;
  texto: string;
  marca: MarcaTexto;
};

export type CapituloTexto = {
  libroId: string;
  capitulo: number;
  aviso: string;
  versiculos: VersiculoTexto[];
};

export type TiempoVersiculo = {
  capitulo: number;
  versiculo: number;
  inicio: number;
  fin: number;
};

const AVISO = "Texto ficticio de prueba. No es una edición bíblica y no sustituye al texto con licencia, que no está en este repositorio.";

const FIXTURE: Record<string, Record<number, { es: string; en: string }[]>> = {
  gn: {
    1: [
      { es: "FIXTURE", en: "FIXTURE" },
      { es: "FIXTURE", en: "FIXTURE" },
      { es: "FIXTURE", en: "FIXTURE" },
      { es: "FIXTURE", en: "FIXTURE" },
      { es: "FIXTURE", en: "FIXTURE" },
    ],
  },
};

export function describirFuente(url: string | undefined): { modo: "fixture" | "remota-sin-conectar"; url: string | null } {
  if (url && url.trim()) return { modo: "remota-sin-conectar", url: url.trim() };
  return { modo: "fixture", url: null };
}

export function capituloDePrueba(libroId: string, capitulo: number, locale: "es" | "en", url: string | undefined): CapituloTexto | null {
  if (describirFuente(url).modo === "remota-sin-conectar") return null;
  const filas = FIXTURE[libroId]?.[capitulo];
  if (!filas) return null;
  return {
    libroId,
    capitulo,
    aviso: AVISO,
    versiculos: filas.map((fila, indice) => ({
      capitulo,
      versiculo: indice + 1,
      texto: locale === "en" ? fila.en : fila.es,
      marca: "ficticio",
    })),
  };
}

export function tiemposDeManifiesto(value: unknown): TiempoVersiculo[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const tiempo = item as Partial<TiempoVersiculo>;
    if (typeof tiempo.capitulo !== "number" || typeof tiempo.versiculo !== "number" || typeof tiempo.inicio !== "number" || typeof tiempo.fin !== "number") return [];
    if (tiempo.fin < tiempo.inicio) return [];
    return [{ capitulo: tiempo.capitulo, versiculo: tiempo.versiculo, inicio: tiempo.inicio, fin: tiempo.fin }];
  });
}

export function estadoTiempos(tiempos: readonly TiempoVersiculo[]): "con-tiempos" | "sin-tiempos" {
  return tiempos.length > 0 ? "con-tiempos" : "sin-tiempos";
}

export function versiculoEnTiempo(tiempos: readonly TiempoVersiculo[], segundo: number): TiempoVersiculo | null {
  return tiempos.find((tiempo) => segundo >= tiempo.inicio && segundo < tiempo.fin) ?? null;
}

/** Segundo de entrada del pasaje. Null si el manifiesto no trae esa marca. */
export function inicioDelPasaje(
  tiempos: readonly TiempoVersiculo[] | null | undefined,
  capitulo: number,
  versiculo: number,
  versiculoFin = versiculo,
): number | null {
  if (!tiempos || tiempos.length === 0) return null;
  const exacto = tiempos.find((tiempo) => tiempo.capitulo === capitulo && tiempo.versiculo === versiculo);
  if (exacto) return exacto.inicio;
  const dentro = tiempos
    .filter((tiempo) => tiempo.capitulo === capitulo && tiempo.versiculo >= versiculo && tiempo.versiculo <= versiculoFin)
    .sort((a, b) => a.versiculo - b.versiculo);
  return dentro[0]?.inicio ?? null;
}
