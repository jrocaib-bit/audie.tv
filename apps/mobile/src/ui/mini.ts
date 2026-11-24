/** Rutas donde el mini reproductor no tiene sitio: el reproductor completo, la cola, la bienvenida, el acceso y la hoja de cuenta. */
const SIN_MINI = ["/ahora", "/bienvenida", "/cola", "/entrar", "/cuenta"];

export const RUTAS_PESTANAS = ["/", "/camino", "/retos", "/biblioteca", "/libros", "/sala", "/ajustes"];

/** El mini reproductor se ve en todas las pantallas con navegación mientras haya un episodio cargado. */
export function debeMostrarMini({ path, cargado }: { path: string; cargado: boolean }): boolean {
  if (!cargado) return false;
  return !SIN_MINI.includes(path);
}
