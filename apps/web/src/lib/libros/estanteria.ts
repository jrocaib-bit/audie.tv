/**
 * Estantería de la portada de Libros. SOLO SERVIDOR.
 *
 * Lee `portadas/web/estanteria.json` por `almacen.ts`. El repositorio no lleva ni textos
 * ni imágenes de libros: solo este lector tolerante. Sin origen o sin archivo devuelve `null` y la
 * portada de Libros mantiene el índice en cuadrícula.
 */
import { textoLimpio, type Disponibilidad, type EpisodioDestacado, type VolumenEstanteria } from "@audite/domain";
import { ID_LIBRO, leerJsonLibros } from "./almacen";
import { cargarCatalogo } from "./carga";

const ID_EPISODIO = /^[a-z0-9][a-z0-9-]{0,40}$/;
const COLOR = /^#[0-9a-fA-F]{6}$/;

function cadena(valor: unknown, max = 2000): string | null {
  return typeof valor === "string" && valor.length <= max ? valor : null;
}

function episodio(valor: unknown): EpisodioDestacado | null {
  if (!valor || typeof valor !== "object") return null;
  const bruto = valor as Record<string, unknown>;
  const id = cadena(bruto.episodio_id, 41);
  const etiqueta = cadena(bruto.etiqueta, 120);
  const titulo = cadena(bruto.titulo, 240);
  if (!id || !ID_EPISODIO.test(id) || etiqueta === null || titulo === null) return null;
  return { episodio_id: id, etiqueta: textoLimpio(etiqueta), titulo: textoLimpio(titulo) };
}

/** Un volumen válido o `null`. Los textos de la interfaz salen sin rayas ni punto y coma. */
export function validarVolumen(valor: unknown): Omit<VolumenEstanteria, "disponibilidad"> | null {
  if (!valor || typeof valor !== "object") return null;
  const v = valor as Record<string, unknown>;
  const volumen = v.volumen;
  const id = cadena(v.id, 81);
  const libro = cadena(v.libro, 120);
  const titulo = cadena(v.titulo, 200);
  const subtitulo = cadena(v.subtitulo, 300);
  const rotulo = cadena(v.rotulo, 120);
  const color = cadena(v.color, 7);
  const sinopsis = cadena(v.sinopsis, 1200);
  const credito = cadena(v.credito_obra, 600);
  const total = v.episodios_total;
  if (typeof volumen !== "number" || !Number.isInteger(volumen) || volumen < 1 || volumen > 16) return null;
  if (!id || !ID_LIBRO.test(id) || !libro || !titulo || subtitulo === null || rotulo === null) return null;
  if (!color || !COLOR.test(color) || sinopsis === null || credito === null) return null;
  if (typeof v.borrador !== "boolean") return null;
  if (typeof total !== "number" || !Number.isInteger(total) || total < 0 || total > 10000) return null;
  if (!Array.isArray(v.episodios_destacados) || v.episodios_destacados.length > 3) return null;
  const destacados = v.episodios_destacados.map(episodio);
  if (destacados.some((e) => e === null)) return null;
  return {
    volumen,
    id,
    libro: textoLimpio(libro),
    titulo: textoLimpio(titulo),
    subtitulo: textoLimpio(subtitulo),
    rotulo: textoLimpio(rotulo),
    color,
    sinopsis: textoLimpio(sinopsis),
    credito_obra: textoLimpio(credito),
    borrador: v.borrador,
    episodios_total: total,
    episodios_destacados: destacados as EpisodioDestacado[],
  };
}

/** Valida el JSON entero. Descarta volúmenes mal formados y repetidos. `null` si no queda ninguno. */
export function validarEstanteria(dato: unknown): Omit<VolumenEstanteria, "disponibilidad">[] | null {
  if (!dato || typeof dato !== "object") return null;
  const lista = (dato as { volumenes?: unknown }).volumenes;
  if (!Array.isArray(lista) || lista.length > 16) return null;
  const vistos = new Set<number>();
  const ids = new Set<string>();
  const validos = lista.flatMap((bruto) => {
    const v = validarVolumen(bruto);
    if (!v || vistos.has(v.volumen) || ids.has(v.id)) return [];
    vistos.add(v.volumen);
    ids.add(v.id);
    return [v];
  });
  return validos.length > 0 ? validos.sort((a, b) => a.volumen - b.volumen) : null;
}

/** La estantería unida al catálogo por `id`, en el orden de `volumen`. `null` sin archivo o sin ruta. */
export async function cargarEstanteria(): Promise<VolumenEstanteria[] | null> {
  const validos = validarEstanteria(await leerJsonLibros("portadas/web/estanteria.json"));
  if (!validos) return null;
  const catalogo = new Map((await cargarCatalogo()).map((ficha) => [ficha.id, ficha.disponibilidad]));
  return validos.map((v) => {
    const real: Disponibilidad | undefined = catalogo.get(v.id);
    const disponibilidad: Disponibilidad = v.borrador || real === "borrador" ? "borrador" : (real ?? "preparandose");
    return { ...v, disponibilidad };
  });
}
