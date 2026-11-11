const CLAVE_VOLVER = "audite.volver";
const CLAVE_OIR = "audite.oir";

export function rutaDeVuelta(valor: string | null | undefined): string | null {
  if (!valor) return null;
  const limpia = valor.trim();
  if (!limpia.startsWith("/") || limpia.startsWith("//") || limpia.includes("://") || limpia.includes("\\") || limpia.includes("\n")) return null;
  if (limpia.length > 240) return null;
  return limpia;
}

export function idDeEpisodio(valor: string | null | undefined): string | null {
  const limpio = valor?.trim() ?? "";
  return /^[a-z0-9-]{1,40}$/.test(limpio) ? limpio : null;
}

export function hrefEntrar(lang: "es" | "en", siguiente: string, episodio?: string | null): string {
  const params = new URLSearchParams();
  const ruta = rutaDeVuelta(siguiente);
  if (ruta) params.set("siguiente", ruta);
  params.set("aviso", "reto");
  const id = idDeEpisodio(episodio);
  if (id) params.set("oir", id);
  return `/${lang}/entrar?${params.toString()}`;
}

function almacen(): Storage | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}

export function guardarVuelta(siguiente: string, episodio?: string | null): void {
  const caja = almacen();
  if (!caja) return;
  const ruta = rutaDeVuelta(siguiente);
  if (!ruta) {
    caja.removeItem(CLAVE_VOLVER);
    caja.removeItem(CLAVE_OIR);
    return;
  }
  caja.setItem(CLAVE_VOLVER, ruta);
  const id = idDeEpisodio(episodio);
  if (id) caja.setItem(CLAVE_OIR, id);
  else caja.removeItem(CLAVE_OIR);
}

export function leerVuelta(): { ruta: string | null; episodio: string | null } {
  const caja = almacen();
  if (!caja) return { ruta: null, episodio: null };
  const ruta = rutaDeVuelta(caja.getItem(CLAVE_VOLVER));
  const episodio = idDeEpisodio(caja.getItem(CLAVE_OIR));
  caja.removeItem(CLAVE_VOLVER);
  caja.removeItem(CLAVE_OIR);
  return { ruta, episodio };
}

export function destinoTrasEntrar(ruta: string | null, episodio: string | null): string {
  if (!ruta) return "/escuchar";
  if (!episodio) return ruta;
  const separador = ruta.includes("?") ? "&" : "?";
  return `${ruta}${separador}oir=${encodeURIComponent(episodio)}`;
}
