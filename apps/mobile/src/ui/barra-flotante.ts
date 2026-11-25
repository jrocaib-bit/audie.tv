import { createContext, useContext } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/** Medidas de la barra de pestañas flotante y del mini reproductor que se apoya encima. */
export const BARRA = {
  /** Alto de la píldora. Cada pestaña mide al menos 52 de alto. */
  alto: 64,
  radio: 32,
  /** Separación de la píldora respecto a los laterales de la pantalla. */
  margenLateral: 12,
  /** Ancho de cada pestaña. La píldora mide lo que suman sus pestañas y queda centrada, sin llegar a los bordes. */
  anchoPestana: 72,
  /** Relleno lateral dentro de la píldora. */
  rellenoPildora: 6,
  /** Separación mínima respecto al borde inferior cuando el sistema no reserva margen. */
  margenInferiorMinimo: 14,
  /** Espacio entre el mini reproductor y la píldora. */
  separacionMini: 8,
  /** Alto del mini reproductor flotante: obra de 52, relleno, borde y barra de progreso. */
  altoMini: 74,
} as const;

/** Sombra suave y difusa que despega la píldora del contenido de detrás. */
export const SOMBRA_FLOTANTE = "0px 12px 32px rgba(0, 0, 0, 0.55), 0px 2px 8px rgba(0, 0, 0, 0.35)";

/** Distancia entre la píldora y el borde inferior: el margen del sistema o, si no hay, uno propio. */
export function margenInferiorBarra(insetInferior: number): number {
  return Math.max(insetInferior, BARRA.margenInferiorMinimo);
}

/**
 * Lo que ocupa lo que flota abajo. En las pantallas con pestañas, la píldora y el mini reproductor
 * van sobre el contenido, así que el contenido reserva ese alto para no quedar tapado.
 */
export function huecoInferior({ pestanas, mini, insetInferior }: { pestanas: boolean; mini: boolean; insetInferior: number }): number {
  if (!pestanas) return insetInferior;
  const barra = margenInferiorBarra(insetInferior) + BARRA.alto;
  return mini ? barra + BARRA.separacionMini + BARRA.altoMini : barra;
}

export const HuecoInferiorContext = createContext<number | null>(null);

/** Margen inferior que necesita el contenido de una pantalla para no quedar bajo la barra flotante. */
export function useHuecoInferior(): number {
  const hueco = useContext(HuecoInferiorContext);
  const insets = useSafeAreaInsets();
  return hueco ?? insets.bottom;
}

/** Ancho de la píldora para un número de pestañas: compacta y centrada. */
export function anchoPildora(pestanas: number): number {
  return pestanas * BARRA.anchoPestana + 2 * BARRA.rellenoPildora;
}
