import { useRouter } from "expo-router";
import { useCallback, useMemo } from "react";
import { decidirReproduccion, type DecisionPlay } from "../acceso";
import type { ContextoCola } from "../cola";
import { useTema } from "./tema";

/** Pulsar play en cualquier sitio: pide cuenta si no hay sesión; si no, carga el episodio y abre el reproductor. */
export function useReproducir() {
  const { library } = useTema();
  const router = useRouter();
  const grabados = useMemo(() => new Set(library.catalog.episodes.map((e) => e.id)), [library.catalog.episodes]);
  return useCallback(
    (id: string, opciones: { contexto?: ContextoCola; pos?: number; abrir?: boolean } = {}): DecisionPlay => {
      const decision = decidirReproduccion({ id, grabado: grabados.has(id), haySesion: Boolean(library.sesion) });
      if (decision === "proximamente") return decision;
      if (decision === "cuenta") {
        // Se fija la cola antes de pedir la cuenta: al entrar, arranca desde el mismo sitio.
        library.playEpisode(id, { contexto: opciones.contexto, pos: opciones.pos });
        router.push("/cuenta");
        return decision;
      }
      library.playEpisode(id, { contexto: opciones.contexto, pos: opciones.pos });
      if (opciones.abrir !== false) router.push("/ahora");
      return decision;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [grabados, library.sesion, library.playEpisode, router],
  );
}
