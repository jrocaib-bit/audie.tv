import { useEffect, useRef } from "react";
import { Animated, type StyleProp, type ViewStyle } from "react-native";
import { useMovimientoReducido } from "./tema";

/** Aparece con un fundido y una pequeña subida. */
export function Entrada({ children, orden = 0, style }: { children: React.ReactNode; orden?: number; style?: StyleProp<ViewStyle> }) {
  const reducir = useMovimientoReducido();
  const opacidad = useRef(new Animated.Value(0)).current;
  const subir = useRef(new Animated.Value(14)).current;
  useEffect(() => {
    if (reducir) {
      opacidad.setValue(1);
      subir.setValue(0);
      return;
    }
    const animacion = Animated.parallel([
      Animated.timing(opacidad, { toValue: 1, duration: 420, delay: orden * 70, useNativeDriver: true }),
      Animated.timing(subir, { toValue: 0, duration: 420, delay: orden * 70, useNativeDriver: true }),
    ]);
    animacion.start();
    return () => animacion.stop();
  }, [opacidad, orden, reducir, subir]);
  return <Animated.View style={[style, { opacity: opacidad, transform: [{ translateY: subir }] }]}>{children}</Animated.View>;
}
