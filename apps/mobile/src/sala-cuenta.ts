import type { ParadaNarrativa } from "./sala-recorrido";

/** Lo mínimo de la sesión que necesita el candado (compatible con `Sesion` de @audite/domain). */
export type SesionMinima = { userId: string } | null | undefined;

/** Recorridos completos abiertos para todos, también sin sesión. Lista configurable. */
export const OBRAS_SALA_ABIERTAS = ["gn-01", "gn-07", "is-18"] as const;

export function esObraSalaAbierta(id: string): boolean {
  return (OBRAS_SALA_ABIERTAS as readonly string[]).includes(id);
}

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
 * Con sesión, o si la obra es una de las abiertas: el recorrido completo. Sin sesión: solo el adelanto
 * (la obra y el título de la apertura), sin texto narrativo, sin paradas ni zoom a detalles.
 * Las obras abiertas no abren el vuelo: eso sigue dependiendo de `debeMostrarEntradaSala`.
 */
export function paradasSegunSesion(paradas: ParadaNarrativa[], sesion: SesionMinima, id?: string): { paradas: ParadaNarrativa[]; bloqueado: boolean } {
  if (recorridoAbierto(sesion) || (id && esObraSalaAbierta(id))) return { paradas, bloqueado: false };
  const apertura = paradas.find((p) => p.tipo === "apertura") ?? paradas[0];
  return { paradas: apertura ? [{ ...apertura, texto: "" }] : [], bloqueado: true };
}

/** Invitación del candado (texto largo: fuera de `textos.ts`, que exige microcopy corto). */
export function invitacionSala(lang: "es" | "en"): string {
  return lang === "en"
    ? "Create your free account or sign in to walk through the work, with its texts and details."
    : "Crea tu cuenta gratis o entra para recorrer la obra, con sus textos y detalles.";
}

/** Textos de la pestaña para quien no ha entrado. Fuera de `textos.ts` (microcopy corto). */
export function textoSalaInvitacion(lang: "es" | "en"): { lede: string; cuerpo: string; escuchando: string; gratis: string } {
  return lang === "en"
    ? {
        lede: "The works of art that go with each episode, told as a reportage.",
        cuerpo: "Each piece is seen up close. Three paths are open to everyone. The rest open with your free account.",
        escuchando: "The work of what you're listening to",
        gratis: "Free",
      }
    : {
        lede: "Las obras de arte que acompañan cada episodio, contadas como un reportaje.",
        cuerpo: "Cada pieza se mira de cerca. Tres recorridos están abiertos para todos. El resto se abre con tu cuenta gratuita.",
        escuchando: "La obra de lo que estás escuchando",
        gratis: "Gratis",
      };
}
