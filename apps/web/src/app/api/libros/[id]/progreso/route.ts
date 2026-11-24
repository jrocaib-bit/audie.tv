import { pedirUsuario } from "@/lib/libros/anotaciones-http";
import { respuesta } from "@/lib/libros/acceso";
import { guardarProgreso, leerTodo, validarProgreso } from "@/lib/libros/anotaciones";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Contexto = { params: Promise<{ id: string }> };

export async function GET(request: Request, contexto: Contexto) {
  const { id } = await contexto.params;
  const usuario = await pedirUsuario(request, id);
  if (usuario instanceof Response) return usuario;
  return respuesta(200, { progreso: (await leerTodo(usuario.userId, id)).progreso });
}

export async function PUT(request: Request, contexto: Contexto) {
  const { id } = await contexto.params;
  const usuario = await pedirUsuario(request, id);
  if (usuario instanceof Response) return usuario;
  const valido = validarProgreso(await request.json().catch(() => null), id);
  if (!valido.ok) return respuesta(400, { error: "datos-invalidos" });
  await guardarProgreso(usuario.userId, valido.dato);
  return respuesta(200, { progreso: valido.dato });
}
