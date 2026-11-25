import { useMemo } from "react";
import { infoPaso, textoContexto, vecino, type NombresCola } from "../cola";
import { datosDeReto } from "../temporadas";
import { useTema } from "./tema";

/** Estado de la cola de escucha para pintarlo: texto del contexto, progreso y si hay anterior o siguiente. */
export function useCola() {
  const { library, lang } = useTema();
  const { contexto, colaIds, posCola, progress } = library;
  const episodios = library.catalog.episodes;
  return useMemo(() => {
    const grabados = new Set(episodios.map((e) => e.id));
    const grabado = (id: string) => grabados.has(id);
    const nombres: NombresCola = {
      libro: (id, l) => library.catalog.books.find((b) => b.id === id)?.name[l],
      reto: (id) => {
        const reto = datosDeReto(id);
        return reto ? (reto.tituloCorto ?? reto.titulo) : undefined;
      },
    };
    const info = infoPaso(colaIds, posCola, (id) => progress.episodes[id]?.completed === true);
    return {
      contexto,
      ids: colaIds,
      pos: posCola,
      info,
      largo: textoContexto(contexto, info, lang, nombres, { faltan: true }),
      corto: textoContexto(contexto, info, lang, nombres),
      hayAnterior: vecino(colaIds, posCola, -1, grabado) !== null,
      haySiguiente: vecino(colaIds, posCola, 1, grabado) !== null,
      grabado,
    };
  }, [colaIds, contexto, episodios, lang, library.catalog.books, posCola, progress.episodes]);
}
