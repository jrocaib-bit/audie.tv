import { useEffect, useState } from "react";
import { AccessibilityInfo, Platform } from "react-native";
import { useMobileLibrary } from "../state";
import { dark } from "../theme";

export type Paleta = typeof dark;

/** Colores, idioma y biblioteca de la pantalla. La app es siempre oscura: es la marca. */
export function useTema() {
  const library = useMobileLibrary();
  const c: Paleta = dark;
  const lang: "es" | "en" = library.settings.uiLocale === "en" ? "en" : "es";
  return { c, lang, library, oscuro: true };
}

/** Respeta «reducir movimiento» del sistema. Empieza en true para no animar de más. */
export function useMovimientoReducido(): boolean {
  const [reducir, setReducir] = useState(true);
  useEffect(() => {
    let vivo = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((valor) => {
      if (vivo) setReducir(valor);
    });
    const aviso = AccessibilityInfo.addEventListener("reduceMotionChanged", setReducir);
    return () => {
      vivo = false;
      aviso.remove();
    };
  }, []);
  return reducir;
}

/** Vibración ligera en los toques principales. No hace nada en web. */
export function haptico(): void {
  if (Platform.OS === "web") return;
  void import("expo-haptics")
    .then((mod) => mod.impactAsync(mod.ImpactFeedbackStyle.Light))
    .catch(() => undefined);
}
