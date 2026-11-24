import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Easing, Platform, View, type ViewStyle } from "react-native";

/** Pulso suave de los esqueletos. Con movimiento reducido se queda quieto. */
export function usePulso(): Animated.Value {
  const valor = useRef(new Animated.Value(0.55)).current;
  const [reducido, setReducido] = useState(false);
  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReducido);
  }, []);
  useEffect(() => {
    if (reducido) return;
    const bucle = Animated.loop(
      Animated.sequence([
        Animated.timing(valor, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.quad), useNativeDriver: Platform.OS !== "web" }),
        Animated.timing(valor, { toValue: 0.55, duration: 800, easing: Easing.inOut(Easing.quad), useNativeDriver: Platform.OS !== "web" }),
      ]),
    );
    bucle.start();
    return () => bucle.stop();
  }, [reducido, valor]);
  return valor;
}

export const GRIS_ESQUELETO = "rgba(128,118,104,0.28)";

export function Bloque({ estilo, opacidad }: { estilo: ViewStyle; opacidad: Animated.Value }) {
  return <Animated.View style={[{ backgroundColor: GRIS_ESQUELETO, opacity: opacidad }, estilo]} />;
}

const ALTURAS_LOMO = [1, 1, 1, 1, 1, 1, 1, 1];

/** Lomos grises con la forma final de la estantería y la barra clara debajo. */
export function EsqueletoEstanteria({ ancho, alto, barra }: { ancho: number; alto: number; barra: string }) {
  const pulso = usePulso();
  return (
    <View accessibilityLabel="Cargando la estantería" accessibilityRole="progressbar" style={{ marginTop: 8 }}>
      <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 2, paddingHorizontal: 22, paddingTop: 14, overflow: "hidden" }}>
        {ALTURAS_LOMO.concat(ALTURAS_LOMO).map((f, i) => (
          <Bloque key={i} opacidad={pulso} estilo={{ width: ancho, height: alto * f, borderRadius: 1 }} />
        ))}
      </View>
      <View style={{ height: 14, marginHorizontal: 14, borderRadius: 7, backgroundColor: barra }} />
    </View>
  );
}

/** Tarjeta gris con la forma de la tarjeta de libro. */
export function EsqueletoTarjeta({ fondo, borde }: { fondo: string; borde: string }) {
  const pulso = usePulso();
  return (
    <View style={{ flexDirection: "row", gap: 16, marginHorizontal: 22, marginBottom: 14, padding: 14, borderWidth: 1, borderColor: borde, backgroundColor: fondo, minHeight: 64 }}>
      <Bloque opacidad={pulso} estilo={{ width: 72, height: 108, borderRadius: 4 }} />
      <View style={{ flex: 1, gap: 10, justifyContent: "center" }}>
        <Bloque opacidad={pulso} estilo={{ height: 20, width: "80%", borderRadius: 4 }} />
        <Bloque opacidad={pulso} estilo={{ height: 14, width: "95%", borderRadius: 4 }} />
        <Bloque opacidad={pulso} estilo={{ height: 14, width: "40%", borderRadius: 4 }} />
      </View>
    </View>
  );
}
