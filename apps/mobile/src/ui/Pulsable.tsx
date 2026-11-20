import { useRef } from "react";
import { Animated, Pressable, StyleSheet, type AccessibilityRole, type StyleProp, type ViewStyle } from "react-native";
import { haptico, useMovimientoReducido } from "./tema";

type Props = {
  onPress?: () => void;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Escala al pulsar. */
  escala?: number;
  haptica?: boolean;
  role?: AccessibilityRole;
  label?: string;
  selected?: boolean;
  disabled?: boolean;
  hitSlop?: number;
};

/** Cualquier cosa pulsable: se encoge un poco al tocarla. */
export function Pulsable({ onPress, children, style, escala = 0.97, haptica = false, role = "button", label, selected, disabled, hitSlop }: Props) {
  const valor = useRef(new Animated.Value(1)).current;
  const reducir = useMovimientoReducido();
  const mover = (a: number) => {
    if (reducir) return;
    Animated.spring(valor, { toValue: a, useNativeDriver: true, speed: 40, bounciness: 6 }).start();
  };
  const plano = StyleSheet.flatten(style) ?? {};
  return (
    <Pressable
      style={{ flex: plano.flex, flexGrow: plano.flexGrow, flexShrink: plano.flexShrink, alignSelf: plano.alignSelf }}
      accessibilityRole={role}
      accessibilityLabel={label}
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      hitSlop={hitSlop}
      onPressIn={() => mover(escala)}
      onPressOut={() => mover(1)}
      onPress={() => {
        if (haptica) haptico();
        onPress?.();
      }}
    >
      <Animated.View style={[style, { transform: [{ scale: valor }] }]}>{children}</Animated.View>
    </Pressable>
  );
}
