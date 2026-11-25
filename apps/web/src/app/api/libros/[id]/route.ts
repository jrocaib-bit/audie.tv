import { cortarLibro } from "@audite/domain";
import { cargarFicha, cargarTexto, fichaPublica } from "@/lib/libros/carga";
import { respuesta } from "@/lib/libros/acceso";
import { respuestaPublica } from "@/lib/libros/cache-publica";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Metadatos + índice + adelanto. Nunca lleva bloques posteriores al adelanto, tampoco a premium:
 * el lector pide cada capítulo en su endpoint, que es donde se comprueba el derecho.
 */
export async function GET(request: Request, contexto: { params: Promise<{ id: string }> }) {
  const { id } = await contexto.params;
  const ficha = await cargarFicha(id);
  if (!ficha) return respuesta(404, { error: "no-encontrado" });
  const texto = ficha.disponibilidad === "lectura" ? await cargarTexto(id) : null;
  return respuestaPublica({ ficha: fichaPublica(ficha), lectura: texto ? cortarLibro(texto, false) : null }, request);
}
