import visibles from "../../../content/obras/visibles.json";

export type ObraVisible = {
  id: string;
  episodio: string;
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
  detalle?: boolean;
};

export function obrasVisibles(): ObraVisible[] {
  return visibles as ObraVisible[];
}

export function obraDeEpisodio(episodio: string): ObraVisible | null {
  return obrasVisibles().find((obra) => obra.episodio === episodio) ?? null;
}

export function obraWebp(obra: ObraVisible): string {
  return obra.detalle ? `/obras/${obra.id}-detalle-960.webp` : `/obras/${obra.id}-960.webp`;
}

export function obraAvif(obra: ObraVisible): string {
  return obra.detalle ? `/obras/${obra.id}-detalle-1600.avif` : `/obras/${obra.id}-1600.avif`;
}

export function rotuloObra(obra: ObraVisible, lang: string): string {
  return lang === "en" ? `Genesis · Episode ${obra.numero}` : `Génesis · Episodio ${obra.numero}`;
}
