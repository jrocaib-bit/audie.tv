import { useEffect, useRef, useState } from "react";
import { Animated, View, type StyleProp, type ViewStyle } from "react-native";
import { useMovimientoReducido } from "./tema";

/** Barra de progreso. Se rellena con transform (driver nativo). */
export function ProgressBar({ fraccion, color, pista, alto = 6, style }: { fraccion: number; color: string; pista: string; alto?: number; style?: StyleProp<ViewStyle> }) {
  const reducir = useMovimientoReducido();
  const [ancho, setAncho] = useState(0);
  const valor = useRef(new Animated.Value(0)).current;
  const f = Math.min(1, Math.max(0, fraccion));
  useEffect(() => {
    if (reducir) {
      valor.setValue(f);
      return;
    }
    const animacion = Animated.timing(valor, { toValue: f, duration: 700, useNativeDriver: true });
    animacion.start();
    return () => animacion.stop();
  }, [f, reducir, valor]);
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(f * 100) }}
      onLayout={(e) => setAncho(e.nativeEvent.layout.width)}
      style={[{ height: alto, borderRadius: alto, backgroundColor: pista, overflow: "hidden" }, style]}
    >
      <Animated.View
        style={{
          height: alto,
          width: ancho,
          borderRadius: alto,
          backgroundColor: color,
          transform: [{ translateX: valor.interpolate({ inputRange: [0, 1], outputRange: [-ancho, 0] }) }],
        }}
      />
    </View>
  );
}
