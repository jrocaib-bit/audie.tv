/**
 * Carga del catálogo y del texto de los libros. SOLO SERVIDOR.
 *
 * El repositorio es público: el texto de los libros no vive aquí ni entra en ningún bundle.
 * Se lee del disco en tiempo de ejecución desde AUDITE_LIBROS_RUTA (sin NEXT_PUBLIC).
 * No se usa `import "server-only"` porque el paquete no está instalado y no se añaden
 * dependencias. Solo se importa desde rutas de API y páginas de servidor.
 *
 * Carga futura desde un bucket privado de Supabase (proyecto qdjowihivtqoelurvyke), sin crearlo aquí:
 *   - bucket privado `libros`, sin políticas públicas, con `libros.json` y `json/<id>.json`;
 *   - lectura solo en servidor con la service role, `storage.from("libros").download(ruta)`,
 *     nunca URLs firmadas hacia el cliente;
 *   - la misma interfaz de este módulo (`cargarCatalogo`, `cargarTexto`) con la caché en memoria;
 *   - la migración 20261124120000_libros.sql prevé además `libros_capitulos.json_contenido`
 *     con RLS y función `security definer` para cuando el texto viva en la base de datos.
 */
import { readFileSync, statSync } from "node:fs";
import path from "node:path";
import {
  afirmativo,
  indiceDe,
  urlAmazonSegura,
  type Disponibilidad,
  type EntradaIndice,
  type EpisodioDeLibro,
  type LibroFicha,
  type LibroTexto,
  type TipoCapitulo,
} from "@audite/domain";

export const ID_LIBRO = /^[a-z0-9][a-z0-9-]{0,80}$/;
const ID_PRUEBA_VOL1 = "gen-antes-de-que-hubiera-manana";
const ARCHIVO_PRUEBA_VOL1 = "antes-de-que-hubiera-manana";

export type FichaServidor = LibroFicha & { amazon_kindle_url: string | null };

type CapituloBruto = { tipo?: string; numero?: number | null; titulo?: string };
type EpisodioBruto = { episodio_id?: string; etiqueta?: string; titulo?: string };
type LibroBruto = {
  id?: string;
  orden?: number;
  titulo?: string;
  subtitulo?: string;
  idioma?: string;
  libro_biblico?: string;
  libro_id?: string;
  estado?: string;
  palabras?: number | null;
  estructura_capitulos?: CapituloBruto[];
  episodios_del_libro_comentado?: EpisodioBruto[];
  episodios_cruzados?: EpisodioBruto[];
  amazon_paperback_url?: string;
  amazon_kindle_url?: string;
};

export function rutaLibros(): string | null {
  const valor = process.env.AUDITE_LIBROS_RUTA?.trim();
  return valor ? valor : null;
}

export function mostrarAmazon(): boolean {
  return afirmativo(process.env.AUDITE_MOSTRAR_AMAZON);
}

const cache = new Map<string, { mtime: number; dato: unknown }>();

function leerJson(archivo: string): unknown | null {
  try {
    const mtime = statSync(archivo).mtimeMs;
    const guardado = cache.get(archivo);
    if (guardado && guardado.mtime === mtime) return guardado.dato;
    const dato = JSON.parse(readFileSync(archivo, "utf8")) as unknown;
    cache.set(archivo, { mtime, dato });
    return dato;
  } catch {
    return null;
  }
}

function texto(valor: unknown): string {
  return typeof valor === "string" ? valor : "";
}

function episodios(lista: EpisodioBruto[] | undefined): EpisodioDeLibro[] {
  return (lista ?? []).flatMap((e) =>
    typeof e.episodio_id === "string" && /^[a-z0-9][a-z0-9-]{0,40}$/.test(e.episodio_id)
      ? [{ episodio_id: e.episodio_id, etiqueta: texto(e.etiqueta), titulo: texto(e.titulo) }]
      : [],
  );
}

/** Ids de capítulo como en el JSON canónico: prologo, capitulo-01, epilogo, bibliografia. */
function indiceDeEstructura(estructura: CapituloBruto[] | undefined, adelantoHasta: string): EntradaIndice[] {
  const tipos: TipoCapitulo[] = ["prologo", "capitulo", "epilogo", "bibliografia"];
  const base = (estructura ?? []).flatMap((c, orden) => {
    const tipo = tipos.find((t) => t === c.tipo);
    if (!tipo) return [];
    const numero = typeof c.numero === "number" ? c.numero : null;
    const id = tipo === "capitulo" ? `capitulo-${String(numero ?? orden).padStart(2, "0")}` : tipo;
    return [{ id, tipo, orden, numero, titulo: texto(c.titulo) }];
  });
  const limite = base.find((c) => c.id === adelantoHasta)?.orden ?? -1;
  return base.map((c) => ({ ...c, es_adelanto: c.orden <= limite }));
}

export function cargarTexto(id: string): LibroTexto | null {
  const ruta = rutaLibros();
  if (!ruta || !ID_LIBRO.test(id)) return null;
  const candidatos = [
    path.join(ruta, "prueba", `${id}.json`),
    ...(id === ID_PRUEBA_VOL1 ? [path.join(ruta, "prueba", `${ARCHIVO_PRUEBA_VOL1}.json`)] : []),
    path.join(ruta, "json", `${id}.json`),
  ];
  for (const archivo of candidatos) {
    const dato = leerJson(archivo) as Partial<LibroTexto> | null;
    if (dato && dato.id === id && Array.isArray(dato.capitulos) && dato.capitulos.length > 0) {
      return { ...(dato as LibroTexto), adelanto_hasta_capitulo_id: dato.adelanto_hasta_capitulo_id ?? null };
    }
  }
  return null;
}

export function cargarCatalogo(): FichaServidor[] {
  const ruta = rutaLibros();
  if (!ruta) return [];
  const dato = leerJson(path.join(ruta, "libros.json")) as { libros?: LibroBruto[] } | null;
  const amazon = mostrarAmazon();
  const fichas = (dato?.libros ?? []).flatMap((bruto): FichaServidor[] => {
    const id = texto(bruto.id);
    if (!ID_LIBRO.test(id)) return [];
    const borrador = bruto.estado === "borrador";
    const textoLibro = borrador ? null : cargarTexto(id);
    const disponibilidad: Disponibilidad = borrador ? "borrador" : textoLibro ? "lectura" : "preparandose";
    const adelanto = textoLibro ? textoLibro.adelanto_hasta_capitulo_id : "prologo";
    const estado = bruto.estado === "publicado" ? "publicado" : borrador ? "borrador" : "completo";
    return [
      {
        id,
        slug: id,
        volumen: typeof bruto.orden === "number" ? bruto.orden : 0,
        titulo: texto(bruto.titulo),
        subtitulo: texto(bruto.subtitulo),
        idioma: texto(bruto.idioma) || "es",
        libro_biblico: texto(bruto.libro_biblico),
        libro_id: texto(bruto.libro_id),
        estado,
        disponibilidad,
        palabras: typeof bruto.palabras === "number" ? bruto.palabras : null,
        adelanto_hasta_capitulo_id: adelanto,
        indice: textoLibro ? indiceDe(textoLibro) : indiceDeEstructura(bruto.estructura_capitulos, adelanto ?? "prologo"),
        audiolibro_estado: "previsto",
        episodios_del_libro_comentado: episodios(bruto.episodios_del_libro_comentado),
        episodios_cruzados: episodios(bruto.episodios_cruzados),
        amazon_paperback_url: amazon && !borrador ? urlAmazonSegura(bruto.amazon_paperback_url) : null,
        amazon_kindle_url: amazon && !borrador ? urlAmazonSegura(bruto.amazon_kindle_url) : null,
      },
    ];
  });
  // Los volúmenes que se pueden ofrecer, primero. Dentro de cada grupo, por volumen.
  return fichas.sort((a, b) => Number(a.disponibilidad === "borrador") - Number(b.disponibilidad === "borrador") || a.volumen - b.volumen);
}

export function cargarFicha(id: string): FichaServidor | null {
  return cargarCatalogo().find((ficha) => ficha.id === id) ?? null;
}

/** Quita lo que solo debe ver la web: nunca sale una URL de Kindle por la API. */
export function fichaPublica(ficha: FichaServidor): LibroFicha {
  const { amazon_kindle_url: _kindle, ...resto } = ficha;
  void _kindle;
  return resto;
}
