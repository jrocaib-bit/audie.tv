import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { carpetaPortadas } from "@/lib/libros/estanteria";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Solo estos nombres: lomo-01.webp, cubierta-16-960.avif. Nada de rutas. */
export const NOMBRE_PORTADA = /^(lomo|cubierta)-(0[1-9]|1[0-6])(-(480|960))?\.(webp|avif)$/;
const TIPOS: Record<string, string> = { webp: "image/webp", avif: "image/avif" };

function noEncontrado(): Response {
  return new Response("No encontrado", { status: 404, headers: { "Cache-Control": "no-store", "Content-Type": "text/plain; charset=utf-8" } });
}

/** Portadas de la estantería. Material público de presentación, sin texto premium. */
export async function GET(request: Request, contexto: { params: Promise<{ archivo: string }> }) {
  const { archivo } = await contexto.params;
  const carpeta = carpetaPortadas();
  if (!carpeta || typeof archivo !== "string" || !NOMBRE_PORTADA.test(archivo)) return noEncontrado();
  const ruta = path.join(carpeta, archivo);
  try {
    const info = await stat(ruta);
    if (!info.isFile()) return noEncontrado();
    const etag = `"${info.size.toString(16)}-${Math.floor(info.mtimeMs).toString(16)}"`;
    const cabeceras = {
      "Content-Type": TIPOS[archivo.slice(archivo.lastIndexOf(".") + 1)] ?? "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      ETag: etag,
    };
    if (request.headers.get("if-none-match") === etag) return new Response(null, { status: 304, headers: cabeceras });
    const datos = await readFile(ruta);
    return new Response(new Uint8Array(datos), { status: 200, headers: { ...cabeceras, "Content-Length": String(datos.byteLength) } });
  } catch {
    return noEncontrado();
  }
}
