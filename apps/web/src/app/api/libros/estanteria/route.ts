import { respuestaPublica } from "@/lib/libros/cache-publica";
import { cargarEstanteria } from "@/lib/libros/estanteria";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Estantería para la app: metadatos y episodios destacados. Nunca texto de capítulos. */
export async function GET(request: Request) {
  const volumenes = await cargarEstanteria();
  if (!volumenes) return Response.json({ error: "no-disponible" }, { status: 404, headers: { "Cache-Control": "public, max-age=30" } });
  return respuestaPublica({ volumenes }, request);
}
