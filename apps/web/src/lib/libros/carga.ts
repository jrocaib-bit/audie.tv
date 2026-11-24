/**
 * Carga del catálogo y del texto de los libros. SOLO SERVIDOR.
 *
 * El repositorio es público: el texto de los libros no vive aquí ni entra en ningún bundle.
 * Se lee del disco en tiempo de ejecución desde AUDITE_LIBROS_RUTA (sin NEXT_PUBLIC).
 * No se usa `import "server-only"` porque el paquete no está instalado y no se añaden
 * dependencias. Solo se importa desde rutas de API y páginas de servidor.
 *
 * Los bytes llegan por `almacen.ts` (disco en local o bucket privado de Supabase).
 */
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
import { ID_LIBRO, leerJsonLibros, rutaLibros } from "./almacen";

export { ID_LIBRO, rutaLibros };
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

export function mostrarAmazon(): boolean {
  return afirmativo(process.env.AUDITE_MOSTRAR_AMAZON);
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

export async function cargarTexto(id: string): Promise<LibroTexto | null> {
  if (!ID_LIBRO.test(id)) return null;
  const candidatos = [
    `prueba/${id}.json`,
    ...(id === ID_PRUEBA_VOL1 ? [`prueba/${ARCHIVO_PRUEBA_VOL1}.json`] : []),
    `json/${id}.json`,
  ];
  for (const archivo of candidatos) {
    const dato = (await leerJsonLibros(archivo)) as Partial<LibroTexto> | null;
    if (dato && dato.id === id && Array.isArray(dato.capitulos) && dato.capitulos.length > 0) {
      return { ...(dato as LibroTexto), adelanto_hasta_capitulo_id: dato.adelanto_hasta_capitulo_id ?? null };
    }
  }
  return null;
}

export async function cargarCatalogo(): Promise<FichaServidor[]> {
  const dato = (await leerJsonLibros("libros.json")) as { libros?: LibroBruto[] } | null;
  const amazon = mostrarAmazon();
  const brutos = (dato?.libros ?? []).filter((b) => ID_LIBRO.test(texto(b.id)));
  const textos = await Promise.all(brutos.map((b) => (b.estado === "borrador" ? null : cargarTexto(texto(b.id)))));
  const fichas = brutos.flatMap((bruto, i): FichaServidor[] => {
    const id = texto(bruto.id);
    const borrador = bruto.estado === "borrador";
    const textoLibro = textos[i] ?? null;
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

export async function cargarFicha(id: string): Promise<FichaServidor | null> {
  return (await cargarCatalogo()).find((ficha) => ficha.id === id) ?? null;
}

/** Quita lo que solo debe ver la web: nunca sale una URL de Kindle por la API. */
export function fichaPublica(ficha: FichaServidor): LibroFicha {
  const { amazon_kindle_url: _kindle, ...resto } = ficha;
  void _kindle;
  return resto;
}
