import { useMemo } from "react";
import { caminosDisponibles, idsDeCamino, portadaDeCamino, progresoCamino, type DefCamino, type ProgresoCamino } from "../caminos";
import { useTema } from "./tema";

export type CaminoVista = { def: DefCamino; nombre: string; src: string; progreso: ProgresoCamino; activo: boolean };

export function useCaminos(): CaminoVista[] {
  const { library, lang } = useTema();
  const rangos = library.catalog.rangos;
  const activo = library.settings.caminoActivo;
  return useMemo(
    () =>
      caminosDisponibles(rangos).map((def) => ({
        def,
        nombre: def.nombre[lang],
        src: portadaDeCamino(def),
        progreso: progresoCamino(idsDeCamino(def, rangos), library.progress),
        activo: def.id === activo || (activo === "" && def.id === "biblia"),
      })),
    [activo, lang, library.progress, rangos],
  );
}
