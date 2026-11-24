/**
 * Almacén de los libros. SOLO SERVIDOR.
 *
 * Origen de los bytes, en este orden:
 *   1. AUDITE_LIBROS_RUTA (solo local): lee del disco.
 *   2. NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY: bucket privado (LIBROS_BUCKET, por defecto `libros`).
 *   3. Nada: sin libros, la web mantiene su respaldo.
 *
 * Del bucket se lee con URLs firmadas de 60 s que genera y consume el servidor. Nunca llegan al
 * cliente, ni se registran. Los nombres de objeto salen solo de las listas permitidas de abajo.
 */
import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { clienteServicio } from "./acceso";

export const ID_LIBRO = /^[a-z0-9][a-z0-9-]{0,80}$/;
/** Solo estos nombres: lomo-01.webp, cubierta-16-960.avif. Nada de rutas. */
export const NOMBRE_PORTADA = /^(lomo|cubierta)-(0[1-9]|1[0-6])(-(480|960))?\.(webp|avif)$/;
const RUTA_JSON = /^(libros\.json|portadas\/web\/estanteria\.json|(?:json|prueba)\/[a-z0-9][a-z0-9-]{0,80}\.json)$/;
const SUBRUTA_PORTADAS = "portadas/web";

export const TTL_MS = 10 * 60 * 1000;
const TTL_FALLO_MS = 30 * 1000;
const CADUCIDAD_URL_S = 60;
const ESPERA_MS = 10_000;

export type Origen = "local" | "bucket" | "ninguno";
export type Portada = { datos: Uint8Array; etag: string };

export function rutaLibros(): string | null {
  const valor = process.env.AUDITE_LIBROS_RUTA?.trim();
  return valor ? valor : null;
}

export function nombreBucket(): string {
  return process.env.LIBROS_BUCKET?.trim() || "libros";
}

export function origen(): Origen {
  if (rutaLibros()) return "local";
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const clave = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  return url && clave ? "bucket" : "ninguno";
}

/** Ruta relativa de un JSON de libros, o `null` si no está en la lista permitida. */
export function rutaJsonValida(rel: string): string | null {
  return typeof rel === "string" && RUTA_JSON.test(rel) ? rel : null;
}

function avisar(): void {
  console.warn("[libros] el almacén remoto no responde, se sigue sin libros");
}

// ---- Caché en memoria por instancia -------------------------------------------------------
type Entrada = { caduca: number; dato: unknown };
const cache = new Map<string, Entrada>();
const enVuelo = new Map<string, Promise<unknown>>();
const cacheLocal = new Map<string, { mtime: number; dato: unknown }>();

export function vaciarCacheAlmacen(): void {
  cache.clear();
  enVuelo.clear();
  cacheLocal.clear();
}

async function conCache<T>(clave: string, obtener: () => Promise<{ dato: T | null; fallo: boolean }>): Promise<T | null> {
  const guardado = cache.get(clave);
  if (guardado && guardado.caduca > Date.now()) return guardado.dato as T | null;
  const previo = enVuelo.get(clave);
  if (previo) return (await previo) as T | null;
  const promesa = (async () => {
    const { dato, fallo } = await obtener();
    cache.set(clave, { caduca: Date.now() + (dato === null ? TTL_FALLO_MS : TTL_MS), dato });
    if (fallo) avisar();
    return dato;
  })().finally(() => enVuelo.delete(clave));
  enVuelo.set(clave, promesa);
  return (await promesa) as T | null;
}

// ---- Bucket --------------------------------------------------------------------------------
type Descarga = { bytes: Uint8Array | null; fallo: boolean };

async function descargarBucket(rel: string): Promise<Descarga> {
  const cliente = clienteServicio();
  if (!cliente) return { bytes: null, fallo: false };
  try {
    const firma = await cliente.storage.from(nombreBucket()).createSignedUrl(rel, CADUCIDAD_URL_S);
    const url = firma.data?.signedUrl;
    if (firma.error || !url) {
      const e = firma.error as { message?: string; status?: number | string; statusCode?: number | string } | null;
      const ausente = !!e && (/not.?found/i.test(e.message ?? "") || [400, 404].includes(Number(e.status ?? e.statusCode)));
      return { bytes: null, fallo: !ausente };
    }
    const r = await fetch(url, { signal: AbortSignal.timeout(ESPERA_MS), cache: "no-store" });
    if (!r.ok) return { bytes: null, fallo: r.status !== 404 };
    return { bytes: new Uint8Array(await r.arrayBuffer()), fallo: false };
  } catch {
    return { bytes: null, fallo: true };
  }
}

// ---- JSON ------------------------------------------------------------------------------------
async function jsonLocal(base: string, rel: string): Promise<unknown | null> {
  const archivo = path.join(base, ...rel.split("/"));
  try {
    const mtime = (await stat(archivo)).mtimeMs;
    const guardado = cacheLocal.get(archivo);
    if (guardado && guardado.mtime === mtime) return guardado.dato;
    const dato = JSON.parse(await readFile(archivo, "utf8")) as unknown;
    cacheLocal.set(archivo, { mtime, dato });
    return dato;
  } catch {
    return null;
  }
}

/** Lee un JSON de libros por su ruta relativa permitida. `null` si no existe, no es válido o falla. */
export async function leerJsonLibros(rel: string): Promise<unknown | null> {
  const ruta = rutaJsonValida(rel);
  if (!ruta) return null;
  const base = rutaLibros();
  if (base) return jsonLocal(base, ruta);
  if (origen() !== "bucket") return null;
  return conCache<unknown>(`${nombreBucket()}/${ruta}`, async () => {
    const { bytes, fallo } = await descargarBucket(ruta);
    if (!bytes) return { dato: null, fallo };
    try {
      return { dato: JSON.parse(new TextDecoder().decode(bytes)) as unknown, fallo: false };
    } catch {
      return { dato: null, fallo: true };
    }
  });
}

// ---- Portadas ------------------------------------------------------------------------------
/** Bytes de una portada o lomo. `null` si el nombre no es válido, no existe o falla el almacén. */
export async function leerPortada(archivo: string): Promise<Portada | null> {
  if (typeof archivo !== "string" || !NOMBRE_PORTADA.test(archivo)) return null;
  const base = rutaLibros();
  if (base) {
    try {
      const ruta = path.join(base, ...SUBRUTA_PORTADAS.split("/"), archivo);
      const info = await stat(ruta);
      if (!info.isFile()) return null;
      const datos = new Uint8Array(await readFile(ruta));
      return { datos, etag: `"${info.size.toString(16)}-${Math.floor(info.mtimeMs).toString(16)}"` };
    } catch {
      return null;
    }
  }
  if (origen() !== "bucket") return null;
  const { bytes, fallo } = await descargarBucket(`${SUBRUTA_PORTADAS}/${archivo}`);
  if (!bytes) {
    if (fallo) avisar();
    return null;
  }
  const huella = createHash("sha1").update(bytes).digest("hex").slice(0, 16);
  return { datos: bytes, etag: `"${bytes.byteLength.toString(16)}-${huella}"` };
}
