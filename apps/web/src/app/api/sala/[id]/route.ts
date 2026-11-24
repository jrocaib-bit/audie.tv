import { createClient } from "@supabase/supabase-js";
import { esPremium } from "@/lib/es-premium";
import { adelantoSala, resolverRecorrido } from "@/lib/sala-recorridos";
import { reportajePremium } from "@/lib/sala-reportaje";
import type { RespuestaSala } from "@/lib/sala-cuenta";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function respuesta(estado: number, cuerpo: unknown) {
  return Response.json(cuerpo, { status: estado, headers: { "Cache-Control": "no-store" } });
}

/**
 * La sala en tres estados. Sin sesión / token inválido / cuenta gratuita: solo el adelanto (apertura).
 * El recorrido completo (pasos y cierre) solo con token verificado Y `esPremium` (subscription_status.status === "active").
 */
export async function GET(request: Request, contexto: { params: Promise<{ id: string }> }) {
  const { id } = await contexto.params;
  const lang = new URL(request.url).searchParams.get("lang") === "en" ? "en" : "es";
  const apertura = adelantoSala(id, lang);
  if (!apertura) return respuesta(404, { error: "no-encontrado" });
  const adelanto = (acceso: "sin-sesion" | "gratuito"): Response => respuesta(200, { acceso, apertura } satisfies RespuestaSala);
  const completo = (): Response => {
    const r = resolverRecorrido(id, lang)!;
    // Radios de la máscara y comparativa: solo premium, nunca en el adelanto.
    const { radios, comparativa } = reportajePremium(id, lang);
    const pasos = r.pasos.map((p, i) => (radios[i] ? { ...p, radio: radios[i] } : p));
    return respuesta(200, { acceso: "premium", ...r, pasos, ...(comparativa ? { comparativa } : {}) } satisfies RespuestaSala);
  };

  // Solo fuera de producción: capturas locales con `sesionMock` (no hay token real). En producción se ignora.
  if (process.env.NODE_ENV !== "production") {
    const mock = request.headers.get("x-sala-mock");
    if (mock === "sin") return adelanto("sin-sesion");
    if (mock === "gratis") return adelanto("gratuito");
    if (mock === "premium" || mock === "con" || mock === "1") return completo();
  }

  const token = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim() ?? "";
  if (!token) return adelanto("sin-sesion");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";
  if (!url || !anon) return respuesta(503, { error: "no-disponible" });
  const opciones = { auth: { persistSession: false, autoRefreshToken: false } };
  let userId: string | null = null;
  try {
    const sesion = await createClient(url, anon, opciones).auth.getUser(token);
    userId = !sesion.error && sesion.data.user ? sesion.data.user.id : null;
  } catch {
    userId = null;
  }
  if (!userId) return adelanto("sin-sesion");

  // Misma lectura que la ruta de audio (service role, SOLO `select status` de la fila del propio usuario).
  // Sin clave de servicio o ante cualquier error: sin estado → no premium.
  let status: string | null = null;
  const servicio = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";
  if (servicio) {
    try {
      const fila = await createClient(url, servicio, opciones).from("subscription_status").select("status").eq("user_id", userId).maybeSingle();
      status = typeof fila.data?.status === "string" ? fila.data.status : null;
    } catch {
      status = null;
    }
  }
  return esPremium({ status }) ? completo() : adelanto("gratuito");
}
