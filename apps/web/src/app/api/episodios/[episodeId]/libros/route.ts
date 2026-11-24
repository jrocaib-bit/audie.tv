import { capituloQueCita, recomendarLibros } from "@audite/domain";
import { cargarCatalogo, cargarTexto } from "@/lib/libros/carga";
import { respuesta } from "@/lib/libros/acceso";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Libros que comentan un episodio. Solo metadatos y, si se sabe, el capítulo que lo cita. */
export async function GET(_request: Request, contexto: { params: Promise<{ episodeId: string }> }) {
  const { episodeId } = await contexto.params;
  if (!/^[a-z0-9][a-z0-9-]{0,40}$/.test(episodeId)) return respuesta(404, { error: "no-encontrado" });
  const libros = await Promise.all(
    recomendarLibros(episodeId, await cargarCatalogo()).map(async (item) => {
      const texto = await cargarTexto(item.id);
      return { ...item, capitulo_id: texto ? capituloQueCita(texto, episodeId) : null };
    }),
  );
  return respuesta(200, { libros });
}
