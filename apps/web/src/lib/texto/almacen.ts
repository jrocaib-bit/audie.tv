/**
 * Almacén del texto del reproductor. SOLO SERVIDOR.
 *
 * Nombre relativo de cada fichero: `<idioma>/<idEpisodio>.json` (por ejemplo `es/gn-01.json`).
 *
 * Origen, en este orden:
 *   1. AUDITE_TEXTO_RUTA (solo local, nunca en producción): lee del disco.
 *   2. Bucket privado (diseño para producción, SIN IMPLEMENTAR y SIN CREAR):
 *      - Bucket `texto` (o TEXTO_BUCKET), privado, sin políticas públicas. Solo la service role lee.
 *      - Mismos nombres relativos que en disco: `es/gn-01.json`.
 *      - El servidor genera una URL firmada de 60 s con la service role, la consume él mismo con
 *        `fetch` y descarta la URL. La URL nunca llega al cliente ni a los logs.
 *      - Caché en memoria por instancia, TTL de 10 min para aciertos y 30 s para fallos, con
 *        deduplicación de peticiones en vuelo.
 *      - El JSON descargado pasa por el mismo esquema estricto que el de disco.
 *      Ver docs/TEXTO_REPRODUCTOR.md. Mientras no exista, el origen es "ninguno".
 *   3. Nada: la API responde que el episodio no tiene texto.
 *
 * Los mensajes de error y de log nunca incluyen la ruta del disco.
 */
import "server-only";
import { idTextoValido, type TextoEpisodio } from "@audite/domain";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { IDIOMAS_TEXTO, validarTexto, type IdiomaTexto } from "./esquema";

export type OrigenTexto = "local" | "ninguno";
export type LecturaTexto =
  | { estado: "ok"; texto: TextoEpisodio }
  | { estado: "sin-texto" }
  | { estado: "invalido" };

export const TTL_CACHE_MS = 10 * 60 * 1000;

export function rutaTexto(): string | null {
  const valor = process.env.AUDITE_TEXTO_RUTA?.trim();
  return valor ? valor : null;
}

export function origenTexto(): OrigenTexto {
  return rutaTexto() ? "local" : "ninguno";
}

/** Nombre relativo permitido, o null. Sin recorrido de rutas. */
export function nombreRelativo(idioma: string, id: string): string | null {
  if (!(IDIOMAS_TEXTO as readonly string[]).includes(idioma) || !idTextoValido(id)) return null;
  return `${idioma}/${id}.json`;
}

const cacheLocal = new Map<string, { mtime: number; texto: TextoEpisodio }>();

export function vaciarCacheTexto(): void {
  cacheLocal.clear();
}

function avisar(motivo: string, id: string): void {
  console.warn(`[texto] ${motivo}: ${id}`);
}

async function leerLocal(base: string, idioma: IdiomaTexto, id: string): Promise<LecturaTexto> {
  const relativo = nombreRelativo(idioma, id);
  if (!relativo) return { estado: "sin-texto" };
  const raiz = path.resolve(base);
  const ruta = path.resolve(raiz, relativo);
  if (!ruta.startsWith(raiz + path.sep)) return { estado: "sin-texto" };
  let mtime: number;
  try {
    // La ruta es local y externa al proyecto. Sin turbopackIgnore, el build rastrearía todo el repo.
    const info = await stat(/*turbopackIgnore: true*/ ruta);
    if (!info.isFile()) return { estado: "sin-texto" };
    mtime = info.mtimeMs;
  } catch {
    return { estado: "sin-texto" };
  }
  const guardado = cacheLocal.get(relativo);
  if (guardado && guardado.mtime === mtime) return { estado: "ok", texto: guardado.texto };
  let crudo: unknown;
  try {
    crudo = JSON.parse(await readFile(/*turbopackIgnore: true*/ ruta, "utf8")) as unknown;
  } catch {
    avisar("fichero ilegible", relativo);
    return { estado: "invalido" };
  }
  const texto = validarTexto(crudo, id, idioma);
  if (!texto) {
    avisar("fichero fuera de esquema", relativo);
    return { estado: "invalido" };
  }
  cacheLocal.set(relativo, { mtime, texto });
  return { estado: "ok", texto };
}

export async function leerTexto(idioma: IdiomaTexto, id: string): Promise<LecturaTexto> {
  const base = rutaTexto();
  if (base) return leerLocal(base, idioma, id);
  return { estado: "sin-texto" };
}
