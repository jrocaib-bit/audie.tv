/** Manejadores HTTP compartidos por marcadores, subrayados y notas. SOLO SERVIDOR. */
import { ID_LIBRO, cargarFicha } from "./carga";
import { resolverLector, respuesta } from "./acceso";
import { borrarElemento, crearElemento, leerTodo, validarElemento, type TipoLista } from "./anotaciones";

type Contexto = { params: Promise<{ id: string }> };

/** 401 sin sesión: el cliente guarda solo en el dispositivo. */
export async function pedirUsuario(request: Request, libroId: string): Promise<{ userId: string } | Response> {
  if (!ID_LIBRO.test(libroId) || !cargarFicha(libroId)) return respuesta(404, { error: "no-encontrado" });
  const lector = await resolverLector(request);
  if (!lector.userId) return respuesta(401, { error: "sin-sesion" });
  return { userId: lector.userId };
}

export function manejadoresLista(tipo: TipoLista) {
  return {
    async GET(request: Request, contexto: Contexto) {
      const { id } = await contexto.params;
      const usuario = await pedirUsuario(request, id);
      if (usuario instanceof Response) return usuario;
      const todo = await leerTodo(usuario.userId, id);
      return respuesta(200, { [tipo]: todo[tipo] });
    },
    async POST(request: Request, contexto: Contexto) {
      const { id } = await contexto.params;
      const usuario = await pedirUsuario(request, id);
      if (usuario instanceof Response) return usuario;
      const cuerpo = await request.json().catch(() => null);
      const valido = validarElemento(tipo, cuerpo, id);
      if (!valido.ok) return respuesta(400, { error: "datos-invalidos" });
      await crearElemento(usuario.userId, tipo, valido.dato);
      return respuesta(201, { item: valido.dato });
    },
    async DELETE(request: Request, contexto: Contexto) {
      const { id } = await contexto.params;
      const usuario = await pedirUsuario(request, id);
      if (usuario instanceof Response) return usuario;
      const itemId = new URL(request.url).searchParams.get("id") ?? "";
      if (!/^[A-Za-z0-9._-]{1,64}$/.test(itemId)) return respuesta(400, { error: "datos-invalidos" });
      await borrarElemento(usuario.userId, id, tipo, itemId);
      return respuesta(200, { ok: true });
    },
  };
}
