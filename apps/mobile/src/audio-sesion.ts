import type { AudioMode } from "expo-audio";

/**
 * Modo de audio de Audite. No es mezclable porque iOS solo muestra Now Playing
 * y los controles de bloqueo cuando la sesión no lleva mixWithOthers.
 */
export const MODO_AUDIO: Partial<AudioMode> = {
  playsInSilentMode: true,
  shouldPlayInBackground: true,
  interruptionMode: "doNotMix",
};

/** Espera para reafirmar después de la cola asíncrona de expo-video. */
export const REAFIRMAR_MS = 300;

export type EstadoApp = "active" | "background" | "inactive" | "unknown" | "extension";

/** Decide si hay que reafirmar la sesión de audio al cambiar el estado de la app. */
export function debeReafirmarSesion({ estadoApp, sonando }: { estadoApp: EstadoApp | string; sonando: boolean }): boolean {
  if (estadoApp === "active") return true;
  if (estadoApp === "background" || estadoApp === "inactive") return sonando;
  return false;
}
