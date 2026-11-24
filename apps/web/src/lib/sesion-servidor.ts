/**
 * Origen de sesión de las rutas protegidas (audio y texto). SOLO SERVIDOR.
 * Un único sitio que lee el token, crea el cliente de servicio y resuelve el usuario.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { UsuarioAudio } from "@/lib/audio-acceso";

export function tokenDePeticion(request: Request): string {
  return request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim() ?? "";
}

/** Cliente con la clave de servicio, o null si falta configuración. */
export function clienteServicio(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const clave = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";
  if (!url || !clave) return null;
  return createClient(url, clave, { auth: { persistSession: false, autoRefreshToken: false } });
}

/**
 * Usuario del token. `conSuscripcion` lee también `subscription_status`.
 * Devuelve null si el token no vale.
 */
export async function usuarioDeToken(cliente: SupabaseClient, token: string, conSuscripcion: boolean): Promise<UsuarioAudio | null> {
  const sesion = await cliente.auth.getUser(token);
  const user = sesion.data.user;
  if (sesion.error || !user) return null;
  let subscriptionStatus: string | null = null;
  if (conSuscripcion) {
    const fila = await cliente.from("subscription_status").select("status").eq("user_id", user.id).maybeSingle();
    subscriptionStatus = typeof fila.data?.status === "string" ? fila.data.status : null;
  }
  return { email: user.email ?? null, subscriptionStatus };
}

/** El audio solo consulta la suscripción si su modo de acceso la pide. */
export function audioPideSuscripcion(): boolean {
  return (process.env.AUDIO_ACCESO ?? "").trim().toLowerCase() === "suscripcion";
}
