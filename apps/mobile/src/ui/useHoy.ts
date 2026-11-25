import { localIsoDate, playableEpisodes } from "@audite/domain";
import { useMemo } from "react";
import { infoEpisodio, modeloHoy, type CtxHoy } from "../hoy";
import { useTema } from "./tema";

export function useContextoCatalogo(): Pick<CtxHoy, "lang" | "libros" | "titulos" | "etiquetas" | "duraciones" | "rangos" | "actual" | "grabados"> {
  const { library, lang } = useTema();
  const { catalog } = library;
  return useMemo(() => {
    const titulos: CtxHoy["titulos"] = {};
    const etiquetas: NonNullable<CtxHoy["etiquetas"]> = {};
    const duraciones: Record<string, number> = {};
    for (const p of catalog.pendientes) titulos[p.id] = p.tituloCorto;
    for (const e of catalog.episodes) {
      titulos[e.id] = e.tituloCorto ?? titulos[e.id];
      etiquetas[e.id] = e.etiqueta;
      duraciones[e.id] = e.durationSeconds;
    }
    return { lang, libros: catalog.books, titulos, etiquetas, duraciones, rangos: catalog.rangos, actual: library.currentEpisode?.id ?? null, grabados: playableEpisodes(catalog).map((e) => e.id) };
  }, [catalog, lang, library.currentEpisode?.id]);
}

export function useModeloHoy() {
  const { library } = useTema();
  const base = useContextoCatalogo();
  const ahora = new Date();
  const hoyIso = localIsoDate(ahora);
  const hora = ahora.getHours();
  return useMemo(
    () =>
      modeloHoy({
        ...base,
        hoyIso,
        hora,
        progress: library.progress,
        caminoId: library.settings.caminoActivo,
      }),
    [base, hora, hoyIso, library.progress, library.settings.caminoActivo],
  );
}

/** El episodio que carga el reproductor, con lo que hace falta para mostrarlo. */
export function useEpisodioCargado() {
  const { library } = useTema();
  const base = useContextoCatalogo();
  const episodio = library.currentEpisode;
  return useMemo(() => {
    if (!episodio) return null;
    return { episodio, info: infoEpisodio(episodio.id, base) };
  }, [base, episodio]);
}
