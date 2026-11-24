/**
 * Quién puede leer el texto. SOLO SERVIDOR.
 *
 * TEXTO_BIBLICO_ACTIVO=1 enciende la función. Sin él, la ruta responde 404 y la web no pinta el panel.
 * TEXTO_ACCESO:
 *   - como-audio (por defecto): mismas reglas que el audio del episodio. Quien puede escuchar, puede leer.
 *   - suscripcion: solo `subscription_status = active`.
 *   - abierto: sin comprobación. Solo para pruebas.
 * En esta línea de la app no está el paquete server-only. Este archivo solo lo importan rutas de servidor.
 */
import { esAudioGratis, puedeEscuchar, type UsuarioAudio } from "@/lib/audio-acceso";
import { audioPideSuscripcion, clienteServicio, tokenDePeticion, usuarioDeToken } from "@/lib/sesion-servidor";

export type ModoAccesoTexto = "como-audio" | "suscripcion" | "abierto";
export type DecisionTexto = { permitido: true } | { permitido: false; estado: 401 | 403 | 503; error: string };

export function textoActivo(): boolean {
  return process.env.TEXTO_BIBLICO_ACTIVO?.trim() === "1";
}

export function modoAccesoTexto(): ModoAccesoTexto {
  const valor = (process.env.TEXTO_ACCESO ?? "").trim().toLowerCase();
  return valor === "suscripcion" || valor === "abierto" ? valor : "como-audio";
}

/**
 * Usuario simulado para probar estados sin crear cuentas. Solo con NODE_ENV distinto de production.
 * `gratis`: cuenta sin suscripción. `premium`: suscripción activa.
 */
export function usuarioSimulado(request: Request): UsuarioAudio | null {
  if (process.env.NODE_ENV === "production") return null;
  const valor = new URL(request.url).searchParams.get("mock") ?? request.headers.get("x-texto-mock");
  if (valor === "gratis") return { email: null, subscriptionStatus: null };
  if (valor === "premium") return { email: null, subscriptionStatus: "active" };
  return null;
}

function negado(estado: 401 | 403 | 503, error: string): DecisionTexto {
  return { permitido: false, estado, error };
}

async function usuarioReal(request: Request, conSuscripcion: boolean): Promise<UsuarioAudio | DecisionTexto> {
  const token = tokenDePeticion(request);
  if (!token) return negado(401, "sin-sesion");
  const cliente = clienteServicio();
  if (!cliente) return negado(503, "no-disponible");
  const usuario = await usuarioDeToken(cliente, token, conSuscripcion);
  return usuario ?? negado(401, "sin-sesion");
}

function esDecision(valor: UsuarioAudio | DecisionTexto): valor is DecisionTexto {
  return "permitido" in valor;
}

export async function decidirAcceso(request: Request, id: string): Promise<DecisionTexto> {
  const modo = modoAccesoTexto();
  if (modo === "abierto") return { permitido: true };
  if (modo === "como-audio" && esAudioGratis(id, process.env.AUDIO_GRATIS)) return { permitido: true };
  const conSuscripcion = modo === "suscripcion" || audioPideSuscripcion();
  const obtenido = usuarioSimulado(request) ?? (await usuarioReal(request, conSuscripcion));
  if (esDecision(obtenido)) return obtenido;
  if (modo === "suscripcion") {
    return obtenido.subscriptionStatus === "active" ? { permitido: true } : negado(403, "sin-permiso");
  }
  return puedeEscuchar(obtenido, process.env.AUDIO_ACCESO, process.env.AUDIO_EMAILS_PERMITIDOS) ? { permitido: true } : negado(403, "sin-permiso");
}
