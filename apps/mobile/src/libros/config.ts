import { mockValido, type MockLibros, type RecomendacionLibro } from "@audite/domain";

declare const __DEV__: boolean | undefined;

export function baseContenido(valor: string | undefined = process.env.EXPO_PUBLIC_CONTENT_BASE): string {
  return (valor?.trim() || "http://127.0.0.1:43123").replace(/\/$/, "");
}

export const enDesarrollo = typeof __DEV__ !== "undefined" && __DEV__ === true;

/**
 * Mock de desarrollo: `?mock=sin|gratis|premium` en la ruta o EXPO_PUBLIC_LIBROS_MOCK.
 * Fuera de desarrollo (build de producción) siempre es null. El servidor lo ignora igualmente en producción.
 */
export function mockDeDesarrollo(valor: string | null | undefined, desarrollo: boolean = enDesarrollo): MockLibros | null {
  if (!desarrollo) return null;
  return mockValido(valor) ?? mockValido(process.env.EXPO_PUBLIC_LIBROS_MOCK);
}

/** Ruta del lector para una recomendación. Si se conoce el capítulo que cita el episodio, abre ahí. */
export function rutaDeRecomendacion(libro: Pick<RecomendacionLibro, "id" | "capitulo_id">): string {
  const base = `/libros/${libro.id}/leer`;
  return libro.capitulo_id && libro.capitulo_id !== "prologo" ? `${base}?c=${libro.capitulo_id}` : base;
}
