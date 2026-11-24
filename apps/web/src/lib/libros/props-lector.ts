/**
 * Props del lector que viajan al cliente (RSC). SOLO SERVIDOR.
 * El candado está aquí: siempre sale `cortarLibro(libro, false)`, sea cual sea el visitante.
 * El resto del libro llega capítulo a capítulo desde la API, que comprueba el derecho.
 * La sesión vive en el navegador (Supabase con localStorage), así que el servidor de páginas
 * no puede saber si hay premium: por eso nunca serializa más que el adelanto.
 */
import { cortarLibro, type CapituloLibro, type EntradaIndice, type LibroTexto, type MockLibros } from "@audite/domain";

export type PropsLector = {
  lang: string;
  libro: { id: string; slug: string; titulo: string; subtitulo: string; libro_biblico: string; volumen: number };
  indice: EntradaIndice[];
  /** Solo capítulos de adelanto, con bloques. */
  capitulos: CapituloLibro[];
  capituloInicial: string;
  /** Capítulo pedido por `?c=` que no es de adelanto. El cliente lo pide a la API. */
  capituloPedido: string | null;
  bloqueInicial: string | null;
  /** Solo en desarrollo. En producción siempre es null. */
  mock: MockLibros | null;
};

const ID = /^[A-Za-z0-9._-]{1,100}$/;

export function armarPropsLector(
  libro: LibroTexto,
  ficha: { slug: string; volumen: number },
  opciones: { lang: string; capitulo?: string | null; bloque?: string | null; mock: MockLibros | null },
): PropsLector {
  const cortado = cortarLibro(libro, false);
  const visibles = cortado.capitulos.map((capitulo) => capitulo.id);
  const pedido = opciones.capitulo && ID.test(opciones.capitulo) && cortado.indice.some((e) => e.id === opciones.capitulo) ? opciones.capitulo : null;
  const inicial = pedido && visibles.includes(pedido) ? pedido : (visibles[0] ?? cortado.indice[0]?.id ?? "");
  return {
    lang: opciones.lang,
    libro: { id: libro.id, slug: ficha.slug, titulo: libro.titulo, subtitulo: libro.subtitulo, libro_biblico: libro.libro_biblico, volumen: ficha.volumen },
    indice: cortado.indice,
    capitulos: cortado.capitulos,
    capituloInicial: inicial,
    capituloPedido: pedido && !visibles.includes(pedido) ? pedido : null,
    bloqueInicial: opciones.bloque && ID.test(opciones.bloque) ? opciones.bloque : null,
    mock: opciones.mock,
  };
}
