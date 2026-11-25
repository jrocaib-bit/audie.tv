/** Episodios de Audite del libro bíblico de un volumen. Sin React Native: se prueba con Vitest. */
import { episodiosDeLibro, type Episode, type PendingEpisode } from "@audite/domain";

export type FilaAudio = {
  id: string;
  pendiente: PendingEpisode | null;
  grabado: Episode | null;
  destacado: boolean;
};

const sinAcentos = (valor: string) => valor.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

/** Id del libro bíblico (`gn`) a partir del nombre de la estantería («Génesis») o del `libro_id` de la ficha. */
export function idDeLibroBiblico(books: readonly { id: string; name: { es: string; en: string } }[], pistas: { libro_id?: string | null; nombre?: string | null }): string | null {
  const porId = pistas.libro_id ? books.find((b) => b.id === pistas.libro_id) : undefined;
  if (porId) return porId.id;
  const nombre = sinAcentos(pistas.nombre ?? "");
  if (!nombre) return null;
  return books.find((b) => sinAcentos(b.name.es) === nombre || sinAcentos(b.name.en) === nombre)?.id ?? null;
}

/**
 * Filas de la hoja «Audios de este libro»: primero los episodios destacados de la estantería, después el resto
 * en el orden del libro. Los episodios sin grabar salen al final de cada grupo, sin botón de reproducir.
 */
export function audiosDelLibro(opciones: {
  bookId: string;
  pendientes: readonly PendingEpisode[];
  grabados: readonly Episode[];
  destacados: readonly { episodio_id: string }[];
}): FilaAudio[] {
  const grabados = new Map(opciones.grabados.map((e) => [e.id, e]));
  const delLibro = episodiosDeLibro(opciones.pendientes, opciones.bookId);
  const idsDelLibro = new Set(delLibro.map((e) => e.id));
  const delGrabados = opciones.grabados.filter((e) => e.bookId === opciones.bookId && !idsDelLibro.has(e.id));
  const filas: FilaAudio[] = [
    ...delLibro.map((p) => ({ id: p.id, pendiente: p, grabado: grabados.get(p.id) ?? null, destacado: false })),
    ...delGrabados.map((g) => ({ id: g.id, pendiente: null, grabado: g, destacado: false })),
  ];
  const ids = new Set(opciones.destacados.map((d) => d.episodio_id));
  const marcadas = filas.map((f) => ({ ...f, destacado: ids.has(f.id) }));
  const orden = new Map(opciones.destacados.map((d, i) => [d.episodio_id, i]));
  const primeras = marcadas.filter((f) => f.destacado).sort((a, b) => (orden.get(a.id) ?? 0) - (orden.get(b.id) ?? 0));
  const resto = marcadas.filter((f) => !f.destacado);
  const reproducibles = (lista: FilaAudio[]) => [...lista.filter((f) => f.grabado), ...lista.filter((f) => !f.grabado)];
  return [...reproducibles(primeras), ...reproducibles(resto)];
}
