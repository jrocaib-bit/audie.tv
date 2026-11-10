import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const APP_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../app");

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

export const IDIOMAS_PUBLICADOS = ["es"] as const;

const RUTAS_IDIOMA = ["", "/membresia", "/ayuda", "/contacto", "/app", "/privacidad", "/aviso-legal", "/entrar", "/condiciones"] as const;
const RETOS_PUBLICADOS = ["adviento-isaias", "navidad-infancia"] as const;

export function canonicalPropio(pathname: string, lang = "es"): string {
  const limpia = (pathname.split("?")[0] || "/").replace(/\/$/, "") || "/";
  if (limpia === "/") return `/${lang}`;
  return limpia;
}

export function entradasSitemap(base = origenSitio()): string[] {
  const urls = new Set<string>();
  for (const lang of IDIOMAS_PUBLICADOS) {
    for (const ruta of RUTAS_IDIOMA) urls.add(`${base}/${lang}${ruta}`);
  }
  for (const id of RETOS_PUBLICADOS) urls.add(`${base}/reto/${id}`);
  urls.add(`${base}/cuenta`);
  return [...urls];
}

export function rutaDeSitemapExiste(url: string, appDir = APP_DIR): boolean {
  const pathname = new URL(url).pathname.replace(/\/$/, "") || "/";
  if (pathname === "/cuenta") return existsSync(path.join(appDir, "cuenta/page.tsx"));
  if (pathname.startsWith("/reto/")) {
    const id = pathname.slice("/reto/".length);
    return (RETOS_PUBLICADOS as readonly string[]).includes(id) && existsSync(path.join(appDir, "reto/[id]/page.tsx"));
  }
  const [, lang, ...resto] = pathname.split("/");
  if (!(IDIOMAS_PUBLICADOS as readonly string[]).includes(lang ?? "")) return false;
  const relativo = resto.length ? path.join("[lang]", ...resto, "page.tsx") : path.join("[lang]", "page.tsx");
  return existsSync(path.join(appDir, relativo));
}
