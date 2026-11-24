import {
  destinosDeCapitulo,
  episodioDelLibro,
  formatClock,
  libroCoincide,
  nombreDeCapitulo,
  rotuloTramo,
  type CapituloIndice,
  type IndiceBiblia,
  type LibroIndice,
  type SeccionIndice,
  type TestamentoId,
  type TestamentoIndice,
} from "@audite/domain";
import indiceJson from "../../../content/canon/indice-capitulos.json";

export const indiceBiblia = indiceJson as IndiceBiblia;

export type FiltroTestamento = "todos" | TestamentoId;

/** Testamentos y secciones con al menos un libro que coincide. Las vacías desaparecen. */
export function filtrarIndice(indice: IndiceBiblia, consulta: string, testamento: FiltroTestamento): TestamentoIndice[] {
  return indice.testamentos
    .filter((item) => testamento === "todos" || item.id === testamento)
    .map((item) => ({
      ...item,
      secciones: item.secciones
        .map((seccion): SeccionIndice => ({ ...seccion, libros: seccion.libros.filter((libro) => libroCoincide(libro, consulta)) }))
        .filter((seccion) => seccion.libros.length > 0),
    }))
    .filter((item) => item.secciones.length > 0);
}

export type DestinoApp = {
  id: string;
  titulo: string;
  tramo: string;
  inicio: string | null;
  disponible: boolean;
};

export type DetalleCapitulo = { nombre: string; nota: string | null; destinos: DestinoApp[] };

/** Lo que la app enseña al tocar un capítulo. `inicio` solo existe si el índice trae el segundo. */
export function detalleDeCapitulo(libro: LibroIndice, capitulo: CapituloIndice, lang: string, disponibles: ReadonlySet<string>): DetalleCapitulo {
  const idioma = lang === "en" ? "en" : "es";
  return {
    nombre: nombreDeCapitulo(libro, capitulo.n, idioma),
    nota: capitulo.unido?.nota[idioma] ?? null,
    destinos: destinosDeCapitulo(capitulo).map((enlace) => {
      const episodio = episodioDelLibro(libro, enlace.id);
      return {
        id: enlace.id,
        titulo: episodio?.titulo[idioma] ?? enlace.id,
        tramo: episodio ? rotuloTramo(libro.titulo[idioma], episodio.desde, episodio.hasta, idioma) : "",
        inicio: enlace.segundo != null ? formatClock(enlace.segundo) : null,
        disponible: disponibles.has(enlace.id),
      };
    }),
  };
}
