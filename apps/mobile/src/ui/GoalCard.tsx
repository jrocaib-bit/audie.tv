import { Text, View } from "react-native";
import { fonts } from "../theme";
import { Boton } from "./Basicos";
import { ProgressBar } from "./ProgressBar";
import { Pulsable } from "./Pulsable";
import type { Paleta } from "./tema";

/** El camino activo como una meta de ahorro: número grande, barra, botón. */
export function GoalCard({ c, nombre, hechos, total, fraccion, de, accion, onAccion, onAbrir }: { c: Paleta; nombre: string; hechos: number; total: number; fraccion: number; de: string; accion: string; onAccion: () => void; onAbrir: () => void }) {
  return (
    <Pulsable onPress={onAbrir} label={nombre} escala={0.985} style={{ borderRadius: 24, padding: 20, gap: 14, backgroundColor: c.card, borderWidth: 1, borderColor: c.line }}>
      <Text style={{ color: c.muted, fontFamily: fonts.medium, fontSize: 14 }}>{nombre}</Text>
      <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
        <Text style={{ color: c.ink, fontFamily: fonts.serif, fontSize: 56, lineHeight: 60 }}>{hechos}</Text>
        <Text style={{ color: c.muted, fontFamily: fonts.sans, fontSize: 18 }}>{de} {total}</Text>
      </View>
      <ProgressBar fraccion={fraccion} color={c.accent} pista={c.line} alto={8} />
      <Boton c={c} texto={accion} onPress={onAccion} secundario style={{ minHeight: 48, alignSelf: "stretch" }} />
    </Pulsable>
  );
}
