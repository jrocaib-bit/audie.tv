/** Resuelve la URL firmada de un episodio. /api/audio/{id} devuelve JSON, no audio. */
export type ErrorAudio = "entrar" | "premium" | "proximamente" | "idioma" | "limite" | "red" | "servidor" | "reproductor";

export type ResultadoAudio = { ok: true; url: string; expira: number } | { ok: false; error: ErrorAudio };

export type RespuestaLike = { status: number; json: () => Promise<unknown> };
export type FetchLike = (url: string, init?: { headers?: Record<string, string> }) => Promise<RespuestaLike>;

export type CacheAudio = Map<string, { url: string; expira: number }>;

const MARGEN_MS = 60_000;

/** Una URL firmada ya cargada hay que renovarla si caduca dentro del margen o ya caducó. */
export function necesitaRenovar(expira: number | undefined, ahora: number = Date.now()): boolean {
  if (expira === undefined) return false;
  return expira - MARGEN_MS <= ahora;
}

export function crearCacheAudio(): CacheAudio {
  return new Map();
}

export function errorDeEstado(estado: number): ErrorAudio {
  if (estado === 401) return "entrar";
  if (estado === 403) return "premium";
  if (estado === 404) return "proximamente";
  if (estado === 429) return "limite";
  return "servidor";
}

type Opciones = { base: string; token?: string | null; fetch: FetchLike; ahora?: number; cache?: CacheAudio };

export async function resolverAudio(id: string, { base, token, fetch, ahora = Date.now(), cache }: Opciones): Promise<ResultadoAudio> {
  const guardada = cache?.get(id);
  if (guardada && guardada.expira - MARGEN_MS > ahora) return { ok: true, url: guardada.url, expira: guardada.expira };
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  let respuesta: RespuestaLike;
  try {
    respuesta = await fetch(`${base}/api/audio/${encodeURIComponent(id)}`, { headers });
  } catch {
    return { ok: false, error: "red" };
  }
  if (respuesta.status !== 200) return { ok: false, error: errorDeEstado(respuesta.status) };
  let cuerpo: unknown;
  try {
    cuerpo = await respuesta.json();
  } catch {
    return { ok: false, error: "servidor" };
  }
  const dato = cuerpo as { url?: unknown; expira?: unknown } | null;
  if (!dato || typeof dato.url !== "string" || !/^https?:\/\//.test(dato.url)) return { ok: false, error: "servidor" };
  const expira = typeof dato.expira === "number" && Number.isFinite(dato.expira) ? dato.expira : ahora + 3_600_000;
  cache?.set(id, { url: dato.url, expira });
  return { ok: true, url: dato.url, expira };
}
