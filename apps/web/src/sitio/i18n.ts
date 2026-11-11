import borrador from "../../../../content/sitio/borrador.json";
import en from "../../../../content/sitio/en.json";
import es from "../../../../content/sitio/es.json";

export type SitioCopy = typeof es;
export const idiomasPublicos = ["es", "en", "it", "pt", "fr", "de", "zh"] as const;
export type IdiomaPublico = (typeof idiomasPublicos)[number];

const borradores = borrador as { estado: "borrador"; it: Partial<SitioCopy>; pt: Partial<SitioCopy>; fr: Partial<SitioCopy>; de: Partial<SitioCopy>; zh: Partial<SitioCopy> };

function capa(lang: string): Partial<SitioCopy> | null {
  if (lang === "es") return es;
  if (lang === "en") return en;
  if (lang === "it" || lang === "pt" || lang === "fr" || lang === "de" || lang === "zh") return borradores[lang];
  return null;
}

export function esIdiomaPublico(lang: string): lang is IdiomaPublico {
  return (idiomasPublicos as readonly string[]).includes(lang);
}

/** Falta una cadena: primero en, después es. */
export function copiaSitio(lang: string): SitioCopy | null {
  if (!esIdiomaPublico(lang)) return null;
  const propio = capa(lang) ?? {};
  const salida = { ...es };
  for (const clave of Object.keys(es) as (keyof SitioCopy)[]) {
    const valor = propio[clave];
    const ingles = en[clave];
    salida[clave] = (typeof valor === "string" && valor.trim() ? valor : undefined) ?? (lang === "es" ? es[clave] : ingles || es[clave]);
  }
  salida.code = lang;
  salida.htmlLang = lang;
  return salida;
}

export function rutaDeInicio(locale: string): string {
  return (idiomasPublicos as readonly string[]).includes(locale) ? `/${locale}` : "/es";
}

export function esRutaPublica(pathname: string): boolean {
  return idiomasPublicos.some((idioma) => pathname === `/${idioma}` || pathname.startsWith(`/${idioma}/`));
}
