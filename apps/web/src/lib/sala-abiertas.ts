/** Obras con el recorrido completo abierto para todos (sin sesión y cuenta gratuita). Lista de servidor, configurable aquí. */
export const OBRAS_SALA_ABIERTAS = ["gn-01", "gn-07", "is-18"] as const;

export function esObraSalaAbierta(id: string): boolean {
  return (OBRAS_SALA_ABIERTAS as readonly string[]).includes(id);
}
