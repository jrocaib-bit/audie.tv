import indice from "../../../content/canon/catalogo-indice.json";
import excepciones from "../../../content/obras/excepciones_repetidas.json";
import visibles from "../../../content/obras/visibles.json";

const PROVISIONALES = new Set(excepciones.pendientes);

const OBRAS_BASE_DEFECTO = "https://qdjowihivtqoelurvyke.supabase.co/storage/v1/object/public/obras/0b6bac7d8587a7e050090142";

export type ObraVisible = {
  id: string;
  episodio: string;
  libro: string;
  numero: number;
  capitulos: string;
  titulo: { es: string; en: string };
  autor: { es: string; en: string };
  fecha: string;
  ubicacion: { es: string; en: string };
  placa: { es: string; en: string };
  escena: { es: string; en: string };
  ancho: number;
  alto: number;
  licencia: string;
  fuente_url: string;
  credito_completo: boolean;
  detalle?: boolean;
};

type LibroIndice = { id: string; name: { es: string; en: string } };

export function obrasBase(): string {
  return (process.env.NEXT_PUBLIC_OBRAS_BASE ?? OBRAS_BASE_DEFECTO).replace(/\/$/, "");
}

export function obrasVisibles(): ObraVisible[] {
  return visibles as ObraVisible[];
}

export function esPortadaProvisional(episodio: string): boolean {
  return PROVISIONALES.has(episodio);
}

export function episodiosSinObra(): readonly string[] {
  return excepciones.pendientes;
}

export function obraDeEpisodio(episodio: string): ObraVisible | null {
  return obrasVisibles().find((obra) => obra.episodio === episodio) ?? null;
}

/** Obra que sí se pinta. Las copias repetidas no llevan cuadro ni crédito de museo. */
export function obraEnPantalla(episodio: string): ObraVisible | null {
  if (esPortadaProvisional(episodio)) return null;
  return obraDeEpisodio(episodio);
}

export function obraWebp(obra: ObraVisible): string {
  if (esPortadaProvisional(obra.episodio)) return `/portada/${obra.episodio}`;
  const sufijo = obra.detalle ? "-detalle-960.webp" : "-960.webp";
  return `${obrasBase()}/${obra.id}${sufijo}`;
}

export function obraAvif(_obra: ObraVisible): null {
  return null;
}

export function rotuloObra(obra: ObraVisible, lang: string): string {
  const ui = lang === "en" ? "en" : "es";
  const libros = (indice as { books: LibroIndice[] }).books;
  const libro = libros.find((item) => item.id === obra.libro);
  const nombre = libro?.name[ui] || libro?.name.es || obra.libro;
  return ui === "en" ? `${nombre} · Episode ${obra.numero}` : `${nombre} · Episodio ${obra.numero}`;
}
