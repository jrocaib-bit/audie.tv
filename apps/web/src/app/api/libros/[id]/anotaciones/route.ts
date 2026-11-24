import { pedirUsuario } from "@/lib/libros/anotaciones-http";
import { respuesta } from "@/lib/libros/acceso";
import { leerTodo } from "@/lib/libros/anotaciones";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Todo lo guardado en cuenta para un libro: progreso, marcadores, subrayados y notas. */
export async function GET(request: Request, contexto: { params: Promise<{ id: string }> }) {
  const { id } = await contexto.params;
  const usuario = await pedirUsuario(request, id);
  if (usuario instanceof Response) return usuario;
  return respuesta(200, { ...(await leerTodo(usuario.userId, id)) });
}
