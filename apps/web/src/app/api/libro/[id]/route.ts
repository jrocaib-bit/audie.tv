import { leerLibro } from "@audite/content/app-catalog";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return Response.json({ id, episodios: leerLibro(id) }, { headers: { "Cache-Control": "public, max-age=300" } });
}
