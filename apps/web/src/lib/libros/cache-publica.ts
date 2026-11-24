/**
 * Cabeceras de caché de las respuestas públicas de Libros (catálogo, ficha con adelanto, estantería).
 * Estas respuestas no dependen de la sesión ni de cookies: solo llevan metadatos y el adelanto gratuito.
 * El control de acceso vive en `/capitulos`, que sigue `no-store`.
 */

export const CACHE_PUBLICA = "public, max-age=60, s-maxage=600, stale-while-revalidate=86400";
export const CACHE_NUNCA = "no-store";

/** En desarrollo, un mock (`?mock=` o `x-libros-mock`) cambia la vista: nunca se cachea. */
export function cabeceraCachePublica(request: Request | null, produccion: boolean = process.env.NODE_ENV === "production"): string {
  if (produccion || !request) return CACHE_PUBLICA;
  const url = new URL(request.url);
  return url.searchParams.has("mock") || request.headers.has("x-libros-mock") ? CACHE_NUNCA : CACHE_PUBLICA;
}

/** JSON público cacheable. Los errores no pasan por aquí. */
export function respuestaPublica(cuerpo: Record<string, unknown>, request: Request | null): Response {
  return Response.json(cuerpo, { headers: { "Cache-Control": cabeceraCachePublica(request) } });
}
