import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { rutaAudio } from "@audite/content/audio-listo";
import { esAudioGratis, puedeEscuchar, type UsuarioAudio } from "@/lib/audio-acceso";
import { audioPideSuscripcion, clienteServicio, tokenDePeticion, usuarioDeToken } from "@/lib/sesion-servidor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TTL = 3600;
const TOPE_HORA = 120;

function respuesta(estado: number, cuerpo: Record<string, unknown>) {
  return Response.json(cuerpo, { status: estado, headers: { "Cache-Control": "no-store" } });
}

function claveDe(valor: string): string {
  return createHash("sha256").update(valor).digest("hex").slice(0, 24);
}

async function dentroDelLimite(cliente: SupabaseClient, clave: string): Promise<boolean> {
  const inicio = new Date();
  inicio.setMinutes(0, 0, 0);
  try {
    const { data, error } = await cliente.rpc("consumir_limite", {
      p_clave: `audio:${clave}`,
      p_periodo: "hora",
      p_inicio: inicio.toISOString(),
      p_tope: TOPE_HORA,
    });
    if (error) return true;
    return data === true;
  } catch {
    return true;
  }
}

export async function GET(request: Request, contexto: { params: Promise<{ id: string }> }) {
  const { id } = await contexto.params;
  const ruta = rutaAudio(id);
  if (!ruta) return respuesta(404, { error: "no-encontrado" });
  const gratis = esAudioGratis(id, process.env.AUDIO_GRATIS);
  const token = tokenDePeticion(request);
  if (!gratis && !token) return respuesta(401, { error: "sin-sesion" });
  const cliente = clienteServicio();
  if (!cliente) return respuesta(503, { error: "no-disponible" });
  let usuario: UsuarioAudio | null = null;
  if (!gratis) {
    usuario = await usuarioDeToken(cliente, token, audioPideSuscripcion());
    if (!usuario) return respuesta(401, { error: "sin-sesion" });
    if (!puedeEscuchar(usuario, process.env.AUDIO_ACCESO, process.env.AUDIO_EMAILS_PERMITIDOS)) {
      return respuesta(403, { error: "sin-permiso" });
    }
  }
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "0";
  const sujeto = usuario?.email || token || ip;
  if (!await dentroDelLimite(cliente, claveDe(sujeto))) return respuesta(429, { error: "limite" });
  const firmada = await cliente.storage.from("audio").createSignedUrl(ruta, TTL);
  if (firmada.error || !firmada.data?.signedUrl) return respuesta(503, { error: "no-disponible" });
  return respuesta(200, { url: firmada.data.signedUrl, expira: Date.now() + TTL * 1000 });
}
