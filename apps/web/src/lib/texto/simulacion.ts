/**
 * Reloj simulado del reproductor para capturas y vídeo. Solo fuera de producción.
 * `?sim=1` avanza el tiempo sin audio. En producción no hace nada.
 */
export function simulacionActiva(busqueda: string, entorno: string | undefined): boolean {
  if (entorno === "production") return false;
  return new URLSearchParams(busqueda).get("sim") === "1";
}

/** Cabecera de simulación de cuenta que el panel reenvía a la API en desarrollo. */
export function mockDeBusqueda(busqueda: string, entorno: string | undefined): "gratis" | "premium" | null {
  if (entorno === "production") return null;
  const valor = new URLSearchParams(busqueda).get("mock");
  return valor === "gratis" || valor === "premium" ? valor : null;
}
