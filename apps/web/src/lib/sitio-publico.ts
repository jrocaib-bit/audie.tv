export function origenSitio(valor = process.env.NEXT_PUBLIC_SITE_URL): string {
  const limpio = valor?.trim().replace(/\/$/, "");
  if (!limpio || /127\.0\.0\.1|localhost/i.test(limpio)) return "https://audite.tv";
  return limpio;
}

export function debeNoindex(host: string, vercelEnv = process.env.VERCEL_ENV): boolean {
  const nombre = host.split(":")[0]?.toLowerCase() ?? "";
  if (nombre === "audite.tv" || nombre === "www.audite.tv") return false;
  if (nombre.endsWith(".vercel.app")) return true;
  return vercelEnv === "preview";
}

export function robotsPara(host: string): string {
  if (debeNoindex(host)) return "User-agent: *\nDisallow: /\n";
  return `User-agent: *\nAllow: /\nSitemap: ${origenSitio()}/sitemap.xml\n`;
}

const IDIOMAS = ["es", "en", "it", "pt", "fr", "de", "zh"] as const;

export function entradasSitemap(base = origenSitio()): string[] {
  const fijas = ["", "/membresia", "/ayuda", "/contacto", "/app", "/privacidad", "/aviso-legal", "/entrar"];
  const retos = ["/reto/adviento-isaias", "/reto/navidad-infancia"];
  const urls = new Set<string>();
  for (const lang of IDIOMAS) {
    for (const ruta of fijas) urls.add(`${base}/${lang}${ruta}`);
  }
  for (const ruta of retos) urls.add(`${base}${ruta}`);
  urls.add(`${base}/ayuda`);
  urls.add(`${base}/contacto`);
  urls.add(`${base}/app`);
  urls.add(`${base}/privacidad`);
  urls.add(`${base}/aviso-legal`);
  urls.add(`${base}/cuenta`);
  return [...urls];
}
