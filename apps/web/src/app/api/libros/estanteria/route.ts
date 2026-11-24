import { cargarEstanteria } from "@/lib/libros/estanteria";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Estantería para la app: metadatos y episodios destacados. Nunca texto de capítulos. */
export async function GET() {
  const volumenes = cargarEstanteria();
  if (!volumenes) return Response.json({ error: "no-disponible" }, { status: 404, headers: { "Cache-Control": "public, max-age=30" } });
  return Response.json({ volumenes }, { headers: { "Cache-Control": "public, max-age=60, s-maxage=60" } });
}
