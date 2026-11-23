/**
 * Los retos exigen cuenta para empezar y para marcar días (web); La sala, para recorrer la obra.
 * Lógica pura: sin sesión no se escribe nada (ni local ni servidor) y se navega a entrar.
 */

export type AccionReto = { tipo: "guardar" } | { tipo: "entrar"; href: string };

/**
 * Solo rutas internas de reto o de La sala: `/reto/{id}`, `/{lang}/retos[/{id}]` o `/{lang}/sala[/{id}]`.
 * Sin query, sin hash, sin esquema, sin `//`, `\` ni `..`: nada que permita un open redirect.
 */
export function rutaInternaSegura(valor: unknown): string | null {
  if (typeof valor !== "string" || valor.length > 120) return null;
  return /^\/(?:reto\/[a-z0-9][a-z0-9-]*|[a-z]{2}\/(?:retos(?:\/[a-z0-9][a-z0-9-]*)?|sala(?:\/[a-z0-9][a-z0-9-]*)?))$/.test(valor) ? valor : null;
}

/** Compatibilidad: mismo validador que `rutaInternaSegura`. */
export const rutaRetoSegura = rutaInternaSegura;

export function hrefEntrarConNext(lang: string, ruta: string): string {
  const idioma = /^[a-z]{2}$/.test(lang) ? lang : "es";
  const segura = rutaInternaSegura(ruta);
  return segura ? `/${idioma}/entrar?next=${encodeURIComponent(segura)}` : `/${idioma}/entrar`;
}

export function hrefEntrarParaReto(lang: string, rutaReto: string): string {
  return hrefEntrarConNext(lang, rutaReto);
}

export function hrefEntrarParaSala(lang: string, rutaSala = "/es/sala"): string {
  const idioma = /^[a-z]{2}$/.test(lang) ? lang : "es";
  const ruta = rutaSala === "/es/sala" && idioma !== "es" ? `/${idioma}/sala` : rutaSala;
  return hrefEntrarConNext(idioma, ruta);
}

/** Destino tras entrar: la ruta pedida si es segura; si no, `/escuchar`. */
export function destinoTrasEntrar(next: unknown, porDefecto = "/escuchar"): string {
  return rutaInternaSegura(next) ?? porDefecto;
}

/** Empezar, Seguir y Marcar: sin sesión solo llevan a entrar. */
export function accionReto(conSesion: boolean, lang: string, rutaReto: string): AccionReto {
  return conSesion ? { tipo: "guardar" } : { tipo: "entrar", href: hrefEntrarParaReto(lang, rutaReto) };
}
