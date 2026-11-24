import { estaSincronizado, idTextoValido } from "@audite/domain";
import { decidirAcceso, textoActivo } from "@/lib/texto/acceso";
import { leerTexto } from "@/lib/texto/almacen";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function respuesta(estado: number, cuerpo: Record<string, unknown>) {
  return Response.json(cuerpo, { status: estado, headers: { "Cache-Control": "no-store" } });
}

export async function GET(request: Request, contexto: { params: Promise<{ id: string }> }) {
  if (!textoActivo()) return respuesta(404, { error: "no-encontrado" });
  const { id } = await contexto.params;
  if (!idTextoValido(id)) return respuesta(404, { error: "no-encontrado" });
  const idioma = new URL(request.url).searchParams.get("lang") === "en" ? "en" : "es";
  const decision = await decidirAcceso(request, id);
  if (!decision.permitido) return respuesta(decision.estado, { error: decision.error });
  const lectura = await leerTexto(idioma, id);
  if (lectura.estado === "sin-texto") return respuesta(404, { error: "sin-texto" });
  if (lectura.estado === "invalido") return respuesta(503, { error: "no-disponible" });
  return Response.json(
    { ...lectura.texto, sincronizado: estaSincronizado(lectura.texto.versiculos) },
    { status: 200, headers: { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex" } },
  );
}
