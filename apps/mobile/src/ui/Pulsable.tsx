import { useState } from "react";
import { Animated, Pressable, type AccessibilityRole, type StyleProp, type ViewStyle } from "react-native";
import { repartirEstilo } from "./estilo";
import { haptico, useMovimientoReducido } from "./tema";

type Props = {
  onPress?: () => void;
  /** Pulsación larga. Quien la usa abre un menú y pone la háptica. */
  onLongPress?: () => void;
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
export function Pulsable({ onPress, onLongPress, children, style, escala = 0.97, haptica = false, role = "button", label, selected, disabled, hitSlop }: Props) {
  const [valor] = useState(() => new Animated.Value(1));
  const reducir = useMovimientoReducido();
  const mover = (a: number) => {
    if (reducir) return;
    Animated.spring(valor, { toValue: a, useNativeDriver: true, speed: 40, bounciness: 6 }).start();
  };
  const { fuera, dentro } = repartirEstilo<ViewStyle>(style);
  return (
    <Pressable
      style={fuera}
      accessibilityRole={role}
      accessibilityLabel={label}
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      hitSlop={hitSlop}
      onPressIn={() => mover(escala)}
      onPressOut={() => mover(1)}
      onLongPress={onLongPress}
      delayLongPress={onLongPress ? 450 : undefined}
      accessibilityActions={onLongPress ? [{ name: "longpress" }] : undefined}
      onAccessibilityAction={onLongPress ? (e) => e.nativeEvent.actionName === "longpress" && onLongPress() : undefined}
      onPress={() => {
        if (haptica) haptico();
        onPress?.();
      }}
    >
      <Animated.View style={[dentro, { transform: [{ scale: valor }] }]}>{children}</Animated.View>
    </Pressable>
  );
}
