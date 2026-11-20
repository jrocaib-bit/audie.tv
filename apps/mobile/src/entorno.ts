/** Base de la web. Expo incrusta EXPO_PUBLIC_CONTENT_BASE si está definida. */
export function baseDeContenido(valor: string | undefined = process.env.EXPO_PUBLIC_CONTENT_BASE): string {
  const limpio = (valor ?? "").trim().replace(/\/$/, "");
  return limpio || "https://audite.tv";
}

export function uriDeObra(src: string, base = baseDeContenido()): string {
  if (/^https?:\/\//.test(src)) return src;
  return `${base}${src.startsWith("/") ? src : `/${src}`}`;
}
