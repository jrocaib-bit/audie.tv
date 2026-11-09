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
      { es: "FIXTURE 1. Esta frase no pertenece a ninguna edición bíblica.", en: "FIXTURE 1. This sentence belongs to no Bible edition." },
      { es: "FIXTURE 2. Sirve solo para probar la lectura en pantalla.", en: "FIXTURE 2. It only tests reading on screen." },
      { es: "FIXTURE 3. El texto con licencia se cargará desde un almacén privado.", en: "FIXTURE 3. Licensed text will load from a private store." },
      { es: "FIXTURE 4. Aquí no hay versículos reales.", en: "FIXTURE 4. There are no real verses here." },
      { es: "FIXTURE 5. Fin del capítulo de prueba.", en: "FIXTURE 5. End of the test chapter." },
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
