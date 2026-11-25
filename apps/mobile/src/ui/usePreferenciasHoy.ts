import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";
import { CLAVE_PREFERENCIAS_HOY, PREFERENCIAS_INICIALES, parsePreferenciasHoy, serializarPreferenciasHoy, type PreferenciasHoy } from "../hoy-preferencias";

/** Preferencias de Hoy guardadas en el dispositivo. Cada cambio se guarda al momento y no se sube a ningún servidor. */
export function usePreferenciasHoy(): { preferencias: PreferenciasHoy; cargadas: boolean; cambiar: (siguiente: (previas: PreferenciasHoy) => PreferenciasHoy) => void } {
  const [estado, setEstado] = useState<{ preferencias: PreferenciasHoy; cargadas: boolean }>({ preferencias: PREFERENCIAS_INICIALES, cargadas: false });

  useEffect(() => {
    let vivo = true;
    void AsyncStorage.getItem(CLAVE_PREFERENCIAS_HOY)
      .then((texto) => parsePreferenciasHoy(texto))
      .catch(() => PREFERENCIAS_INICIALES)
      .then((preferencias) => {
        if (vivo) setEstado((previo) => (previo.cargadas ? previo : { preferencias, cargadas: true }));
      });
    return () => {
      vivo = false;
    };
  }, []);

  const cambiar = useCallback((siguiente: (previas: PreferenciasHoy) => PreferenciasHoy) => {
    setEstado((previo) => {
      const preferencias = siguiente(previo.preferencias);
      void AsyncStorage.setItem(CLAVE_PREFERENCIAS_HOY, serializarPreferenciasHoy(preferencias)).catch(() => undefined);
      return { preferencias, cargadas: true };
    });
  }, []);

  return { ...estado, cambiar };
}
