/** Base de la web. Expo incrusta EXPO_PUBLIC_CONTENT_BASE si está definida. */
export function baseDeContenido(valor: string | undefined = process.env.EXPO_PUBLIC_CONTENT_BASE): string {
  const limpio = (valor ?? "").trim().replace(/\/$/, "");
  return limpio || "https://audite.tv";
}

export function uriDeObra(src: string, base = baseDeContenido()): string {
  if (/^https?:\/\//.test(src)) return src;
  return `${base}${src.startsWith("/") ? src : `/${src}`}`;
}

/** Rutas de Profecías que van en el bundle y no se piden a audite.tv. */
export const RUTAS_OBRAS_BUNDLE = new Set<string>([
  "/obras/reto-profecias_o1-1x1.webp",
  "/obras/reto-profecias_o1-4x5.webp",
  "/obras/reto-profecias_pp-01.webp",
  "/obras/reto-profecias_pp-02.webp",
  "/obras/reto-profecias_pp-03.webp",
  "/obras/reto-profecias_pp-04.webp",
  "/obras/reto-profecias_pp-05.webp",
  "/obras/reto-profecias_pp-06.webp",
  "/obras/reto-profecias_pp-07.webp",
  "/obras/reto-profecias_pp-08.webp",
]);

export function obraEnBundle(src: string): boolean {
  return RUTAS_OBRAS_BUNDLE.has(src);
}
