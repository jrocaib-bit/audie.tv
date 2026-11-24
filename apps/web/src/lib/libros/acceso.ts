/**
 * Quién lee y con qué derecho. SOLO SERVIDOR.
 *
 * Igual que /api/audio/[id]: Bearer, auth.getUser y subscription_status con la service role.
 * Si falta la service role o la lectura falla, el usuario autenticado queda como gratuito,
 * nunca como premium. Sin poder validar el token, se trata como sin sesión.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { mockValido, vistaDeMock, type MockLibros, type VistaLector } from "@audite/domain";
import { esPremium } from "@/lib/es-premium";

export type Lector = { vista: VistaLector; userId: string | null };

export function enProduccion(): boolean {
  return process.env.NODE_ENV === "production";
}

/** Mock de desarrollo: `?mock=sin|gratis|premium` o cabecera `x-libros-mock`. En producción se ignora. */
export function mockDe(request: Request, parametro?: string | null): MockLibros | null {
  if (enProduccion()) return null;
  const url = new URL(request.url);
  return mockValido(parametro ?? url.searchParams.get("mock")) ?? mockValido(request.headers.get("x-libros-mock"));
}

/** Mock para páginas de servidor, que reciben `searchParams`. En producción se ignora. */
export function mockDeParametro(valor: string | string[] | undefined): MockLibros | null {
  if (enProduccion()) return null;
  return mockValido(Array.isArray(valor) ? valor[0] : valor);
}

export function clienteServicio(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const clave = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";
  if (!url || !clave) return null;
  return createClient(url, clave, { auth: { persistSession: false, autoRefreshToken: false } });
}

export function tokenDe(request: Request): string {
  return request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim() ?? "";
}

export async function resolverLector(request: Request): Promise<Lector> {
  const mock = mockDe(request);
  if (mock) return { vista: vistaDeMock(mock), userId: mock === "sin" ? null : `mock-${mock}` };
  const token = tokenDe(request);
  if (!token) return { vista: "sin-sesion", userId: null };
  const cliente = clienteServicio();
  if (!cliente) return { vista: "sin-sesion", userId: null };
  try {
    const sesion = await cliente.auth.getUser(token);
    const user = sesion.data.user;
    if (sesion.error || !user) return { vista: "sin-sesion", userId: null };
    try {
      const fila = await cliente.from("subscription_status").select("status").eq("user_id", user.id).maybeSingle();
      if (fila.error) return { vista: "gratuito", userId: user.id };
      return { vista: esPremium(fila.data as { status?: string | null } | null) ? "premium" : "gratuito", userId: user.id };
    } catch {
      return { vista: "gratuito", userId: user.id };
    }
  } catch {
    return { vista: "sin-sesion", userId: null };
  }
}

export function respuesta(estado: number, cuerpo: Record<string, unknown>): Response {
  return Response.json(cuerpo, { status: estado, headers: { "Cache-Control": "no-store" } });
}
