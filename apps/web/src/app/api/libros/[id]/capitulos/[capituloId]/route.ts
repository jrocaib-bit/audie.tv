import { capituloParaVista } from "@audite/domain";
import { cargarFicha, cargarTexto } from "@/lib/libros/carga";
import { resolverLector, respuesta } from "@/lib/libros/acceso";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Un capítulo. Adelanto: abierto. Resto: solo premium (401 sin sesión, 403 con cuenta gratuita).
 * Las respuestas de error no llevan `texto`, `html` ni `bloques`.
 */
export async function GET(request: Request, contexto: { params: Promise<{ id: string; capituloId: string }> }) {
  const { id, capituloId } = await contexto.params;
  const ficha = await cargarFicha(id);
  if (!ficha || ficha.disponibilidad === "borrador") return respuesta(404, { error: "no-encontrado" });
  const texto = await cargarTexto(id);
  if (!texto) return respuesta(503, { error: "en-preparacion" });
  if (!texto.capitulos.some((capitulo) => capitulo.id === capituloId)) return respuesta(404, { error: "no-encontrado" });
  const lector = await resolverLector(request);
  const resultado = capituloParaVista(texto, capituloId, lector.vista);
  if (resultado.ok) return respuesta(200, { capitulo: resultado.capitulo, vista: lector.vista });
  return respuesta(resultado.motivo === "sin-sesion" ? 401 : 403, { error: resultado.motivo });
}
