import { useEffect, useRef } from "react";
import { Animated, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { useMovimientoReducido } from "./tema";

const CirculoAnimado = Animated.createAnimatedComponent(Circle);

/** Anillo de progreso. El trazo de SVG no admite driver nativo: es un anillo pequeño. */
export function Ring({ fraccion, size = 96, trazo = 8, color, pista, children }: { fraccion: number; size?: number; trazo?: number; color: string; pista: string; children?: React.ReactNode }) {
  const reducir = useMovimientoReducido();
  const valor = useRef(new Animated.Value(0)).current;
  const f = Math.min(1, Math.max(0, fraccion));
  const r = (size - trazo) / 2;
  const largo = 2 * Math.PI * r;
  useEffect(() => {
    if (reducir) {
      valor.setValue(f);
      return;
    }
    const animacion = Animated.timing(valor, { toValue: f, duration: 800, useNativeDriver: false });
    animacion.start();
    return () => animacion.stop();
  }, [f, reducir, valor]);
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(f * 100) }}
      style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}
    >
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={pista} strokeWidth={trazo} fill="none" />
        <CirculoAnimado
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={trazo}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${largo} ${largo}`}
          strokeDashoffset={valor.interpolate({ inputRange: [0, 1], outputRange: [largo, 0] })}
          rotation={-90}
          originX={size / 2}
          originY={size / 2}
        />
      </Svg>
      {children}
    </View>
  );
}
