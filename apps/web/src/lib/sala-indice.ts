import "server-only";
import { loadAppCatalog } from "@audite/content/app-catalog";
import { esPortadaProvisional, obraDeEpisodio, obraWebp } from "@audite/content/obras";
import { esObraSalaAbierta } from "./sala-abiertas";
import { rutaSala } from "./sala-cuenta";
import { idsSala } from "./sala-recorridos";

export type FichaSala = {
  id: string;
  href: string;
  titulo: string;
  libro: string;
  src: string | null;
  alt: string;
  abierta: boolean;
};

/** Las 79 obras de La sala, en el orden del recorrido, con título, libro e imagen. */
export function fichasSala(lang: "es" | "en"): FichaSala[] {
  const catalogo = loadAppCatalog();
  return idsSala().map((id) => {
    const obra = obraDeEpisodio(id);
    const episodio = catalogo.episodes.find((item) => item.id === id) ?? catalogo.pendientes.find((item) => item.id === id);
    const libro = catalogo.books.find((item) => item.id === (episodio?.bookId ?? id.split("-")[0]));
    const src = obra && !esPortadaProvisional(obra.episodio) ? obraWebp(obra) : null;
    return {
      id,
      href: rutaSala(lang, id),
      titulo: obra?.titulo[lang] || episodio?.tituloCorto?.[lang] || episodio?.titulo?.[lang] || id,
      libro: libro?.name[lang] || libro?.name.es || "",
      src,
      alt: obra?.titulo[lang] ?? "",
      abierta: esObraSalaAbierta(id),
    };
  });
}
