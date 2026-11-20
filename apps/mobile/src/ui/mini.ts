/** Rutas donde el mini reproductor no tiene sitio: el reproductor completo, la bienvenida y la cola. */
const SIN_MINI = ["/ahora", "/bienvenida", "/cola"];

export const RUTAS_PESTANAS = ["/", "/camino", "/retos", "/biblioteca", "/ajustes"];

/** El mini reproductor se ve en todas las pantallas mientras haya algo cargado o sonando. */
export function debeMostrarMini({ path, cargado, empezado, repetido }: { path: string; cargado: boolean; empezado: boolean; repetido: boolean }): boolean {
  if (!cargado || !empezado || repetido) return false;
  return !SIN_MINI.includes(path);
}
