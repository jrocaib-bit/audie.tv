import en from "../../../../content/sitio/en.json";
import es from "../../../../content/sitio/es.json";

export type SitioCopy = typeof es;
export const sitios = { es, en } satisfies Record<string, SitioCopy>;
export const idiomasPublicos = Object.keys(sitios);

export function copiaSitio(lang: string): SitioCopy | null {
  if (lang in sitios) return sitios[lang as keyof typeof sitios];
  return null;
}

export function esRutaPublica(pathname: string): boolean {
  return idiomasPublicos.some((idioma) => pathname === `/${idioma}` || pathname.startsWith(`/${idioma}/`));
}
