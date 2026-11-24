import { NOMBRE_PORTADA, leerPortada } from "@/lib/libros/almacen";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export { NOMBRE_PORTADA };
const TIPOS: Record<string, string> = { webp: "image/webp", avif: "image/avif" };

function noEncontrado(): Response {
  return new Response("No encontrado", { status: 404, headers: { "Cache-Control": "no-store", "Content-Type": "text/plain; charset=utf-8" } });
}

/** Portadas de la estantería. Material público de presentación, sin texto premium. */
export async function GET(request: Request, contexto: { params: Promise<{ archivo: string }> }) {
  const { archivo } = await contexto.params;
  if (typeof archivo !== "string" || !NOMBRE_PORTADA.test(archivo)) return noEncontrado();
  const portada = await leerPortada(archivo);
  if (!portada) return noEncontrado();
  const cabeceras = {
    "Content-Type": TIPOS[archivo.slice(archivo.lastIndexOf(".") + 1)] ?? "application/octet-stream",
    "Cache-Control": "public, max-age=31536000, immutable",
    "X-Content-Type-Options": "nosniff",
    ETag: portada.etag,
  };
  if (request.headers.get("if-none-match") === portada.etag) return new Response(null, { status: 304, headers: cabeceras });
  return new Response(new Uint8Array(portada.datos), { status: 200, headers: { ...cabeceras, "Content-Length": String(portada.datos.byteLength) } });
}
