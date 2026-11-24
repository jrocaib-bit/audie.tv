import { useMemo } from "react";
import { audioDeCamino, caminosDisponibles, descripcionCamino, duracionEnDias, idsDeCamino, portadaDeCamino, progresoCamino, type AudioCamino, type DefCamino, type ProgresoCamino } from "../caminos";
import { infoEpisodio, type EpisodioInfo } from "../hoy";
import { useContextoCatalogo } from "./useHoy";
import { useTema } from "./tema";

export type CaminoVista = {
  def: DefCamino;
  nombre: string;
  descripcion: string;
  /** Un episodio al día: «516 días». */
  duracion: string;
  src: string;
  progreso: ProgresoCamino;
  audio: AudioCamino;
  /** Episodio pendiente del camino, con o sin audio. */
  siguiente: (EpisodioInfo & { reproducible: boolean }) | null;
  activo: boolean;
};

export function useCaminos(): CaminoVista[] {
  const { library, lang } = useTema();
  const base = useContextoCatalogo();
  const activo = library.settings.caminoActivo;
  return useMemo(
    () =>
      caminosDisponibles(base.rangos).map((def) => {
        const ids = idsDeCamino(def, base.rangos);
        const progreso = progresoCamino(ids, library.progress);
        return {
          def,
          nombre: def.nombre[lang],
          descripcion: descripcionCamino(def, lang),
          duracion: duracionEnDias(ids.length, lang),
          src: portadaDeCamino(def),
          progreso,
          audio: audioDeCamino(ids, base.grabados),
          siguiente: progreso.siguiente ? { ...infoEpisodio(progreso.siguiente, base), reproducible: base.grabados.includes(progreso.siguiente) } : null,
          activo: def.id === activo || (activo === "" && def.id === "biblia"),
        };
      }),
    [activo, base, lang, library.progress],
  );
}
