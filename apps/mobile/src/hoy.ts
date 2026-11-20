import { obraDeEpisodio, obraWebp } from "../../../packages/content/src/obras-visibles";

export type TarjetaHoy = { id: string; titulo: string; src: string; ruta?: string };

type Idioma = "es" | "en";

const LIBROS: { episodio: string; titulo: { es: string; en: string } }[] = [
  { episodio: "gn-01", titulo: { es: "El paraíso", en: "Paradise" } },
  { episodio: "gn-02", titulo: { es: "La expulsión", en: "The expulsion" } },
  { episodio: "gn-03", titulo: { es: "El arca", en: "The ark" } },
  { episodio: "gn-04", titulo: { es: "Babel", en: "Babel" } },
  { episodio: "gn-05", titulo: { es: "Melquisedec", en: "Melchizedek" } },
  { episodio: "gn-06", titulo: { es: "Mambré", en: "Mamre" } },
];

const CAMINOS: { episodio: string; titulo: { es: string; en: string } }[] = [
  { episodio: "gn-09", titulo: { es: "Rebeca", en: "Rebekah" } },
  { episodio: "gn-10", titulo: { es: "Esaú", en: "Esau" } },
  { episodio: "gn-08", titulo: { es: "Isaac", en: "Isaac" } },
  { episodio: "gn-11", titulo: { es: "Jacob", en: "Jacob" } },
];

const RETOS: { id: string; titulo: { es: string; en: string }; src: string; ruta?: string }[] = [
  { id: "adviento", titulo: { es: "Adviento", en: "Advent" }, src: "/obras/reto-adviento_o2-1x1.webp", ruta: "/reto-adviento" },
  { id: "navidad", titulo: { es: "Navidad", en: "Christmas" }, src: "/obras/reto-navidad_o2-1x1.webp" },
];

function deEpisodio(episodio: string, titulo: { es: string; en: string }, lang: Idioma): TarjetaHoy {
  const obra = obraDeEpisodio(episodio);
  if (!obra) throw new Error(`Sin obra visible para ${episodio}`);
  return { id: episodio, titulo: titulo[lang], src: obraWebp(obra) };
}

/** Libros, caminos y retos de Hoy. Ninguna obra se repite. */
export function tarjetasHoy(lang: Idioma = "es"): { libros: TarjetaHoy[]; caminos: TarjetaHoy[]; retos: TarjetaHoy[] } {
  return {
    libros: LIBROS.map((item) => deEpisodio(item.episodio, item.titulo, lang)),
    caminos: CAMINOS.map((item) => deEpisodio(item.episodio, item.titulo, lang)),
    retos: RETOS.map((item) => ({ id: item.id, titulo: item.titulo[lang], src: item.src, ruta: item.ruta })),
  };
}
