import tabla from "../../web/src/data/bucles.json";

type BucleCrudo = {
  mp4?: string;
  webm?: string;
  poster?: string;
  poster_1280?: string;
  alt?: string;
  aspect?: string;
};

export type BucleMovil = { mp4: string; webm: string; poster: string; alt: string; aspect: string };

function texto(valor: unknown): string {
  return typeof valor === "string" ? valor.trim() : "";
}

function aspectoDe(valor: unknown): string {
  if (typeof valor === "number" && Number.isFinite(valor) && valor > 0) return String(valor);
  if (typeof valor !== "string") return "";
  const limpio = valor.trim().replace(/\s+/g, "");
  const fraccion = limpio.match(/^(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)$/);
  if (fraccion) {
    const ancho = Number(fraccion[1]);
    const alto = Number(fraccion[2]);
    if (ancho > 0 && alto > 0) return `${ancho}/${alto}`;
  }
  const numero = Number(limpio);
  return numero > 0 ? String(numero) : "";
}

function relacionDe(aspect: string): number {
  const propio = aspectoDe(aspect);
  if (!propio) return 16 / 9;
  if (propio.includes("/")) {
    const [ancho, alto] = propio.split("/").map(Number);
    return ancho / alto;
  }
  return Number(propio);
}

function filaDe(valor: unknown): BucleCrudo | null {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) return null;
  const origen = valor as Record<string, unknown>;
  const fila: BucleCrudo = {};
  for (const clave of ["mp4", "webm", "poster", "poster_1280", "alt"] as const) {
    const campo = texto(origen[clave]);
    if (campo) fila[clave] = campo;
  }
  const aspecto = aspectoDe(origen.aspect);
  if (aspecto) fila.aspect = aspecto;
  return fila;
}

/** El JSON público pisa el del repo. Vacío o roto: se ignora. */
export function fusionarMapa(base: Record<string, BucleCrudo>, crudo: string | undefined): Record<string, BucleCrudo> {
  const salida: Record<string, BucleCrudo> = { ...base };
  const plano = (crudo ?? "").trim();
  if (!plano) return salida;
  let parsed: unknown;
  try {
    parsed = JSON.parse(plano);
  } catch {
    return salida;
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return salida;
  for (const [id, valor] of Object.entries(parsed)) {
    const fila = filaDe(valor);
    if (!id.trim() || !fila) continue;
    salida[id] = { ...salida[id], ...fila };
  }
  return salida;
}

function jsonPublico(json?: string): string | undefined {
  if (json !== undefined) return json;
  return process.env.EXPO_PUBLIC_BUCLES_JSON ?? process.env.NEXT_PUBLIC_BUCLES_JSON;
}

/** Misma tabla que la web. Vacía: el reproductor sigue con el cuadro. */
export function bucleDe(id: string, json?: string): BucleMovil | null {
  const fila = fusionarMapa(tabla as Record<string, BucleCrudo>, jsonPublico(json))[id];
  const mp4 = texto(fila?.mp4);
  const webm = texto(fila?.webm);
  if (!mp4 && !webm) return null;
  return {
    mp4,
    webm,
    poster: texto(fila?.poster) || texto(fila?.poster_1280),
    alt: texto(fila?.alt),
    aspect: aspectoDe(fila?.aspect),
  };
}

/** Reserva el hueco: el alto no pasa del 70% de la ventana. */
export function medidasHueco(aspect: string, anchoVentana: number, altoVentana: number): { width: number; height: number } {
  const relacion = relacionDe(aspect);
  const altoMax = Math.max(altoVentana, 0) * 0.7;
  const anchoMax = Math.max(anchoVentana - 44, 0);
  let width = anchoMax;
  let height = width / relacion;
  if (height > altoMax) {
    height = altoMax;
    width = altoMax * relacion;
  }
  return { width, height };
}
