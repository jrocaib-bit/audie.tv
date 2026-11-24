export function palabras(texto: string): string[] {
  return texto.split(/\s+/).filter(Boolean);
}

function plano(texto: string): string {
  return texto.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase();
}

export function coincideLibro(nombre: string, consulta: string): boolean {
  const busqueda = plano(consulta.trim());
  if (!busqueda) return true;
  return plano(nombre).includes(busqueda);
}

export function irAlReproductor(push: (href: string) => void, href = "/ahora") {
  const vista = typeof document === "undefined" ? null : document as Document & { startViewTransition?: (cambio: () => void) => void };
  const quieto = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (vista?.startViewTransition && !quieto) {
    vista.startViewTransition(() => { push(href); });
    return;
  }
  push(href);
}

export function diasDeCalendario(total: number): number[] {
  if (total <= 0) return [];
  return Array.from({ length: total }, (_, indice) => indice + 1);
}
