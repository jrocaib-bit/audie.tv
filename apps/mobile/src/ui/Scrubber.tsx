import { useRef, useState } from "react";
import { PanResponder, Text, View } from "react-native";
import { formatClock } from "@audite/domain";
import { fonts } from "../theme";

type Props = { valor: number; maximo: number; onBuscar: (segundos: number) => void; color: string; pista: string; texto: string; etiqueta: string };

/** Barra de posición arrastrable, con tiempo transcurrido y restante. */
export function Scrubber({ valor, maximo, onBuscar, color, pista, texto, etiqueta }: Props) {
  const ancho = useRef(1);
  const [arrastre, setArrastre] = useState<number | null>(null);
  const ref = useRef({ maximo, onBuscar });
  ref.current = { maximo, onBuscar };
  const aSegundos = (x: number) => Math.min(1, Math.max(0, x / ancho.current)) * ref.current.maximo;
  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (e) => setArrastre(aSegundos(e.nativeEvent.locationX)),
      onPanResponderMove: (e) => setArrastre(aSegundos(e.nativeEvent.locationX)),
      onPanResponderRelease: (e) => {
        ref.current.onBuscar(aSegundos(e.nativeEvent.locationX));
        setArrastre(null);
      },
      onPanResponderTerminate: () => setArrastre(null),
    }),
  ).current;
  const actual = arrastre ?? valor;
  const f = maximo > 0 ? Math.min(1, Math.max(0, actual / maximo)) : 0;
  return (
    <View>
      <View
        {...pan.panHandlers}
        accessibilityRole="adjustable"
        accessibilityLabel={etiqueta}
        accessibilityValue={{ min: 0, max: Math.round(maximo), now: Math.round(actual) }}
        accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
        onAccessibilityAction={(e) => ref.current.onBuscar(Math.min(ref.current.maximo, Math.max(0, valor + (e.nativeEvent.actionName === "increment" ? 15 : -15))))}
        onLayout={(e) => { ancho.current = Math.max(1, e.nativeEvent.layout.width); }}
        style={{ height: 44, justifyContent: "center" }}
      >
        <View pointerEvents="none" style={{ height: 6, borderRadius: 3, backgroundColor: pista }}>
          <View style={{ width: `${f * 100}%`, height: 6, borderRadius: 3, backgroundColor: color }} />
        </View>
        <View pointerEvents="none" style={{ position: "absolute", left: `${f * 100}%`, marginLeft: -9, width: 18, height: 18, borderRadius: 9, backgroundColor: color, transform: [{ scale: arrastre != null ? 1.25 : 1 }] }} />
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={{ color: texto, fontFamily: fonts.sans, fontSize: 13, fontVariant: ["tabular-nums"] }}>{formatClock(actual)}</Text>
        <Text style={{ color: texto, fontFamily: fonts.sans, fontSize: 13, fontVariant: ["tabular-nums"] }}>−{formatClock(Math.max(0, maximo - actual))}</Text>
      </View>
    </View>
  );
}
