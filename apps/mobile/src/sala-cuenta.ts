import type { ParadaNarrativa } from "./sala-recorrido";

/** Lo mínimo de la sesión que necesita el candado (compatible con `Sesion` de @audite/domain). */
export type SesionMinima = { userId: string } | null | undefined;

/** Función pura: los recorridos y textos de La sala solo se ven con cuenta y sesión iniciada. */
export function recorridoAbierto(sesion: SesionMinima): boolean {
  return Boolean(sesion && sesion.userId);
}

/**
 * ¿Se lanza la entrada (vuelo en vivo o viaje v2) y se muestra la ambientación completa de la sala?
 * Solo con sesión iniciada y sin «reducir movimiento». Sin cuenta nunca se abre el vuelo (ni gasta sesión de Map Tiles).
 */
export function debeMostrarEntradaSala(sesion: SesionMinima, reducir: boolean): boolean {
  return recorridoAbierto(sesion) && !reducir;
}

/**
 * Con sesión: el recorrido completo. Sin sesión: solo el adelanto (la obra y el título de la apertura),
 * sin texto narrativo, sin paradas ni zoom a detalles.
 */
export function paradasSegunSesion(paradas: ParadaNarrativa[], sesion: SesionMinima): { paradas: ParadaNarrativa[]; bloqueado: boolean } {
  if (recorridoAbierto(sesion)) return { paradas, bloqueado: false };
  const apertura = paradas.find((p) => p.tipo === "apertura") ?? paradas[0];
  return { paradas: apertura ? [{ ...apertura, texto: "" }] : [], bloqueado: true };
}

/** Invitación del candado (texto largo: fuera de `textos.ts`, que exige microcopy corto). */
export function invitacionSala(lang: "es" | "en"): string {
  return lang === "en"
    ? "Create your free account or sign in to walk through the work, with its texts and details."
    : "Crea tu cuenta gratis o entra para recorrer la obra, con sus textos y detalles.";
}
