import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fonts } from "../theme";
import { Icono, type NombreIcono } from "./Icono";
import { Pulsable } from "./Pulsable";
import type { Paleta } from "./tema";

export type PestanaDef = { href: string; icono: NombreIcono; etiqueta: string };

export function TabBar({ c, pestanas, actual, onElegir }: { c: Paleta; pestanas: PestanaDef[]; actual: string; onElegir: (href: string) => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View accessibilityRole="tablist" style={{ flexDirection: "row", paddingBottom: Math.max(insets.bottom, 8), paddingTop: 6, backgroundColor: c.bg, borderTopWidth: 1, borderTopColor: c.line }}>
      {pestanas.map((p) => {
        const activa = p.href === actual;
        const color = activa ? c.ink : c.muted;
        return (
          <Pulsable key={p.href} role="tab" selected={activa} label={p.etiqueta} onPress={() => onElegir(p.href)} escala={0.9} style={{ flex: 1, minHeight: 52, alignItems: "center", justifyContent: "center", gap: 3 }}>
            <Icono nombre={p.icono} size={25} color={color} trazo={activa ? 2.1 : 1.7} />
            <Text style={{ color, fontFamily: fonts.medium, fontSize: 11, fontWeight: activa ? "600" : "400" }}>{p.etiqueta}</Text>
            <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: activa ? c.accent : "transparent" }} />
          </Pulsable>
        );
      })}
    </View>
  );
}
