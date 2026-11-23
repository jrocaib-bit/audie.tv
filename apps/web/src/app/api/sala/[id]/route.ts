import { createClient } from "@supabase/supabase-js";
import { resolverRecorrido } from "@/lib/sala-recorridos";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function respuesta(estado: number, cuerpo: unknown) {
  return Response.json(cuerpo, { status: estado, headers: { "Cache-Control": "no-store" } });
}

/** Recorrido de La sala: solo con sesión verificada en servidor (Bearer token de Supabase). */
export async function GET(request: Request, contexto: { params: Promise<{ id: string }> }) {
  const { id } = await contexto.params;
  // Solo fuera de producción: capturas locales con `sesionMock` (no hay token real).
  const mockDev = process.env.NODE_ENV !== "production" && request.headers.get("x-sala-mock") === "1";
  const lang = new URL(request.url).searchParams.get("lang") === "en" ? "en" : "es";
  if (mockDev) {
    const r = resolverRecorrido(id, lang);
    return r ? respuesta(200, r) : respuesta(404, { error: "no-encontrado" });
  }
  const token = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim() ?? "";
  if (!token) return respuesta(401, { error: "sin-sesion" });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";
  if (!url || !anon) return respuesta(503, { error: "no-disponible" });
  const cliente = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
  let valido = false;
  try {
    const sesion = await cliente.auth.getUser(token);
    valido = !sesion.error && !!sesion.data.user;
  } catch {
    valido = false;
  }
  if (!valido) return respuesta(401, { error: "sin-sesion" });
  const recorrido = resolverRecorrido(id, lang);
  if (!recorrido) return respuesta(404, { error: "no-encontrado" });
  return respuesta(200, recorrido);
}
