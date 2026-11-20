import { Text, View } from "react-native";
import { fonts } from "../theme";
import { ProgressBar } from "./ProgressBar";
import { Pulsable } from "./Pulsable";
import type { Paleta } from "./tema";

/** El camino activo como un widget de meta: número grande y barra fina. */
export function GoalCard({ c, nombre, hechos, total, fraccion, de, onAbrir }: { c: Paleta; nombre: string; hechos: number; total: number; fraccion: number; de: string; onAbrir: () => void }) {
  return (
    <Pulsable onPress={onAbrir} label={`${nombre}, ${hechos} ${de} ${total}`} escala={0.97} style={{ flex: 1, borderRadius: 24, padding: 16, gap: 8, justifyContent: "space-between", backgroundColor: c.card, borderWidth: 1, borderColor: c.line, minHeight: 132 }}>
      <Text numberOfLines={1} style={{ color: c.muted, fontFamily: fonts.medium, fontSize: 14 }}>{nombre}</Text>
      <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6 }}>
        <Text style={{ color: c.ink, fontFamily: fonts.serif, fontSize: 44, lineHeight: 48 }}>{hechos}</Text>
        <Text style={{ color: c.muted, fontFamily: fonts.sans, fontSize: 14 }}>{de} {total}</Text>
      </View>
      <ProgressBar fraccion={fraccion} color={c.accent} pista={c.line} alto={4} />
    </Pulsable>
  );
}
