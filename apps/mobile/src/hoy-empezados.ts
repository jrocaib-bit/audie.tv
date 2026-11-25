/**
 * Lo que el usuario tiene empezado y aún no ha terminado: libros comentados y retos.
 * Módulo puro (sin React ni almacenamiento) para poder probarlo con Vitest.
 *
 * Fuentes:
 * - Libros: las anotaciones de cada libro en `audite.libros.v1.<libroId>` (ver libros/almacen.ts),
 *   con `progreso` de tipo ProgresoLibro. El índice de capítulos sale de la caché del libro o del catálogo.
 * - Retos: los episodios de cada paso en `library.progress` (audite.progress.v1), como en modeloRetos.
 */
import type { AnotacionesLibro, ProgresoLibro } from "@audite/domain";
import { fijadosPrimero, ordenar, quitadoDe, type Huella, type HuellaReto, type PreferenciasHoy, type Quitado } from "./hoy-preferencias";

/** Prefijo de las anotaciones locales de cada libro. Coincide con `libros/almacen.ts`. */
export const PREFIJO_LECTURA = "audite.libros.v1.";

/** El identificador del libro de una clave de anotaciones, o null si la clave es de otra cosa. */
export function libroIdDeClave(clave: string): string | null {
  if (!clave.startsWith(PREFIJO_LECTURA)) return null;
  const id = clave.slice(PREFIJO_LECTURA.length);
  return id && !id.includes(".") ? id : null;
}

// ---------------------------------------------------------------------------
// Libros

/** A partir de esta fracción del último capítulo el libro cuenta como leído. */
export const UMBRAL_FINAL_LIBRO = 0.98;

export type AvanceLibro = {
  /** Capítulo en curso (1 es el primero). 0 si el índice no lo conoce. */
  capitulo: number;
  total: number;
  fraccion: number;
  terminado: boolean;
};

/**
 * Avance de un libro según su progreso guardado y su índice.
 * Cuentan como lectura todas las entradas del índice menos la bibliografía.
 * Terminado: el progreso está en la última entrada de lectura con ratio de al menos UMBRAL_FINAL_LIBRO,
 * o ya ha pasado a la bibliografía. El lector de la app guarda capítulo y bloque sin ratio. Sin ratio,
 * el capítulo cuenta como a medias y el libro sigue en curso hasta que se pasa a la bibliografía.
 */
export function avanceLibro(progreso: Pick<ProgresoLibro, "capitulo_id" | "ratio">, indice: readonly { id: string; tipo?: string }[]): AvanceLibro {
  const lectura = indice.filter((e) => e.tipo !== "bibliografia");
  const total = lectura.length;
  if (total > 0 && indice.some((e) => e.tipo === "bibliografia" && e.id === progreso.capitulo_id)) return { capitulo: total, total, fraccion: 1, terminado: true };
  const pos = lectura.findIndex((e) => e.id === progreso.capitulo_id);
  if (total === 0 || pos < 0) return { capitulo: 0, total, fraccion: 0, terminado: false };
  const ratio = typeof progreso.ratio === "number" && Number.isFinite(progreso.ratio) ? Math.min(1, Math.max(0, progreso.ratio)) : null;
  const terminado = pos === total - 1 && ratio !== null && ratio >= UMBRAL_FINAL_LIBRO;
  const fraccion = Math.min(1, Math.max(0, (pos + (ratio ?? 0.5)) / total));
  return { capitulo: pos + 1, total, fraccion, terminado };
}

export type InfoLibro = { slug: string; titulo: string; volumen: number | null; indice: readonly { id: string; tipo?: string }[] };

export type LibroEnCurso = AvanceLibro & {
  clave: string;
  slug: string;
  titulo: string;
  volumen: number | null;
  capituloId: string;
  bloqueId: string | null;
  ratio: number | null;
  actualizado: string;
};

function tiempo(iso: string): number {
  const t = Date.parse(iso);
  return Number.isNaN(t) ? 0 : t;
}

/**
 * Libros con progreso guardado que no están terminados. Orden: el leído más recientemente primero
 * (`progreso.updated_at`), y a igualdad, por identificador. Se omiten los libros sin progreso, los
 * terminados y los que aún no tienen título ni índice conocidos (no se inventan tarjetas).
 */
export function librosEnCurso(
  lecturas: readonly { libroId: string; anotaciones: Pick<AnotacionesLibro, "progreso"> }[],
  infoDe: (libroId: string) => InfoLibro | null,
): LibroEnCurso[] {
  const salida: LibroEnCurso[] = [];
  const vistos = new Set<string>();
  for (const { libroId, anotaciones } of lecturas) {
    const progreso = anotaciones.progreso;
    if (!progreso || vistos.has(libroId)) continue;
    const info = infoDe(libroId);
    if (!info) continue;
    const avance = avanceLibro(progreso, info.indice);
    if (avance.terminado) continue;
    vistos.add(libroId);
    salida.push({ ...avance, clave: `libro:${libroId}`, slug: info.slug, titulo: info.titulo, volumen: info.volumen, capituloId: progreso.capitulo_id, bloqueId: progreso.bloque_id ?? null, ratio: progreso.ratio ?? null, actualizado: progreso.updated_at });
  }
  return salida.sort((a, b) => tiempo(b.actualizado) - tiempo(a.actualizado) || a.slug.localeCompare(b.slug));
}

// ---------------------------------------------------------------------------
// Retos

type AvanceEpisodios = { episodes: Record<string, { positionSeconds?: number; completed?: boolean; updatedAt?: string } | undefined> };

export type RetoBase = { id: string; titulo: string; src: string; sinObra?: boolean; pasos: readonly { dia: number; episodio?: string }[] };

export type RetoEnCurso = {
  clave: string;
  id: string;
  titulo: string;
  src: string;
  sinObra: boolean;
  hechos: number;
  total: number;
  fraccion: number;
  /** Día del primer paso pendiente. */
  dia: number;
  /** Episodio del primer paso pendiente. */
  siguiente: string | null;
  /** Avance de cada episodio del reto: segundos escuchados y si está completado. */
  episodios: HuellaReto["episodios"];
  actualizado: string;
};

/**
 * Retos empezados y sin terminar. Un paso está hecho si su episodio está completado (como en modeloRetos).
 * Empezado: al menos un paso hecho o un episodio suyo con avance. Terminado: todos los pasos hechos.
 * Orden: el reto con actividad más reciente primero, y a igualdad, por identificador.
 */
export function retosEnCurso(retos: readonly RetoBase[], progress: AvanceEpisodios): RetoEnCurso[] {
  const salida: RetoEnCurso[] = [];
  for (const reto of retos) {
    const total = reto.pasos.length;
    if (total === 0) continue;
    const hecho = (ep?: string) => Boolean(ep && progress.episodes[ep]?.completed);
    const hechos = reto.pasos.filter((p) => hecho(p.episodio)).length;
    const episodios = [...new Set(reto.pasos.map((p) => p.episodio).filter((e): e is string => Boolean(e)))];
    const conAvance = episodios.some((e) => (progress.episodes[e]?.positionSeconds ?? 0) > 0);
    if (hechos === 0 && !conAvance) continue;
    if (hechos >= total) continue;
    const pendiente = reto.pasos.findIndex((p) => !hecho(p.episodio));
    const paso = reto.pasos[pendiente];
    const avance: HuellaReto["episodios"] = {};
    for (const e of episodios) avance[e] = { s: Math.max(0, progress.episodes[e]?.positionSeconds ?? 0), c: Boolean(progress.episodes[e]?.completed) };
    const actualizado = episodios.map((e) => progress.episodes[e]?.updatedAt ?? "").reduce((a, b) => (tiempo(b) > tiempo(a) ? b : a), "");
    salida.push({
      clave: `reto:${reto.id}`,
      id: reto.id,
      titulo: reto.titulo,
      src: reto.src,
      sinObra: Boolean(reto.sinObra),
      hechos,
      total,
      fraccion: hechos / total,
      dia: paso?.dia ?? pendiente + 1,
      siguiente: paso?.episodio ?? null,
      episodios: avance,
      actualizado,
    });
  }
  return salida.sort((a, b) => tiempo(b.actualizado) - tiempo(a.actualizado) || a.id.localeCompare(b.id));
}

// ---------------------------------------------------------------------------
// Sección «En curso»

export type TarjetaEnCurso = ({ tipo: "libro" } & LibroEnCurso) | ({ tipo: "reto" } & RetoEnCurso);

/** Las tarjetas de la sección en su orden por defecto: primero los libros y después los retos. */
export function tarjetasEnCurso(libros: readonly LibroEnCurso[], retos: readonly RetoEnCurso[]): TarjetaEnCurso[] {
  return [...libros.map((l) => ({ tipo: "libro" as const, ...l })), ...retos.map((r) => ({ tipo: "reto" as const, ...r }))];
}

export type EstadoEnCurso = "lista" | "vacio" | "oculto";

/** «vacio» si no hay nada empezado, «oculto» si lo hay pero el usuario lo quitó todo de Hoy. */
export function estadoEnCurso(empezados: number, visibles: number): EstadoEnCurso {
  if (empezados === 0) return "vacio";
  return visibles === 0 ? "oculto" : "lista";
}

// ---------------------------------------------------------------------------
// Quitar de Hoy

/** La huella del avance de una tarjeta, para guardarla al quitarla de Hoy. */
export function huellaDe(t: TarjetaEnCurso): Huella {
  if (t.tipo === "libro") return { tipo: "libro", capituloId: t.capituloId, bloqueId: t.bloqueId, ratio: t.ratio, actualizado: t.actualizado };
  return { tipo: "reto", hechos: t.hechos, episodios: { ...t.episodios }, actualizado: t.actualizado };
}

/** La fecha `a` es posterior a `b`. Si ninguna de las dos se puede leer, cuenta como posterior. */
function posterior(a: string, b: string): boolean {
  const ta = tiempo(a);
  const tb = tiempo(b);
  return ta > tb || (ta === 0 && tb === 0);
}

/**
 * Si la tarjeta tiene avance nuevo respecto a la huella guardada al quitarla.
 * Libro: otro capítulo, bloque o ratio con `updated_at` posterior.
 * Reto: más pasos hechos, o algún episodio con otros segundos o completado y actividad posterior.
 */
export function hayAvanceNuevo(huella: Huella, t: TarjetaEnCurso): boolean {
  if (huella.tipo !== t.tipo) return true;
  if (huella.tipo === "libro" && t.tipo === "libro") {
    const distinto = huella.capituloId !== t.capituloId || huella.bloqueId !== t.bloqueId || huella.ratio !== t.ratio;
    return distinto && posterior(t.actualizado, huella.actualizado);
  }
  if (huella.tipo === "reto" && t.tipo === "reto") {
    if (t.hechos > huella.hechos) return true;
    const ids = new Set([...Object.keys(huella.episodios), ...Object.keys(t.episodios)]);
    const distinto = [...ids].some((id) => {
      const antes = huella.episodios[id] ?? { s: 0, c: false };
      const ahora = t.episodios[id] ?? { s: 0, c: false };
      return antes.s !== ahora.s || antes.c !== ahora.c;
    });
    return distinto && posterior(t.actualizado, huella.actualizado);
  }
  return false;
}

/** Una tarjeta sigue quitada si se quitó y no tiene avance nuevo. Sin huella sigue quitada hasta que se vuelva a mostrar. */
export function sigueQuitada(q: Quitado | undefined, t: TarjetaEnCurso): boolean {
  if (!q) return false;
  return q.huella === null || !hayAvanceNuevo(q.huella, t);
}

/**
 * Reparte lo empezado entre lo que se ve en Hoy y lo quitado, en el orden del usuario y con lo fijado primero.
 * Una tarjeta quitada con avance nuevo vuelve sola a `visibles`.
 */
export function repartirEnCurso(tarjetas: readonly TarjetaEnCurso[], p: PreferenciasHoy): { visibles: TarjetaEnCurso[]; quitadas: TarjetaEnCurso[] } {
  const porClave = new Map(tarjetas.map((t) => [t.clave, t]));
  const visibles: TarjetaEnCurso[] = [];
  const quitadas: TarjetaEnCurso[] = [];
  for (const clave of ordenar(tarjetas.map((t) => t.clave), p.tarjetas)) {
    const t = porClave.get(clave);
    if (!t) continue;
    (sigueQuitada(quitadoDe(p, clave), t) ? quitadas : visibles).push(t);
  }
  const orden = fijadosPrimero(visibles.map((t) => t.clave), p);
  return { visibles: orden.map((clave) => porClave.get(clave)!), quitadas };
}
