/** Candado de cuenta de La sala (función pura): los recorridos y textos solo se ven con sesión iniciada. */
export type SesionMinima = { userId: string } | null | undefined;

export type VistaSala = "recorrido" | "adelanto";

export function vistaSala(sesion: SesionMinima): VistaSala {
  return sesion && sesion.userId ? "recorrido" : "adelanto";
}
