import { useRouter } from "expo-router";
import { useCallback, useMemo } from "react";
import { decidirReproduccion, type DecisionPlay } from "../acceso";
import { useTema } from "./tema";

/** Pulsar play en cualquier sitio: pide cuenta si no hay sesión; si no, carga el episodio y abre el reproductor. */
export function useReproducir() {
  const { library } = useTema();
  const router = useRouter();
  const grabados = useMemo(() => new Set(library.catalog.episodes.map((e) => e.id)), [library.catalog.episodes]);
  return useCallback(
    (id: string): DecisionPlay => {
      const decision = decidirReproduccion({ id, grabado: grabados.has(id), haySesion: Boolean(library.sesion) });
      if (decision === "proximamente") return decision;
      if (decision === "cuenta") {
        library.setPendiente(id);
        router.push("/cuenta");
        return decision;
      }
      library.playEpisode(id);
      router.push("/ahora");
      return decision;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [grabados, library.sesion, library.playEpisode, library.setPendiente, router],
  );
}
