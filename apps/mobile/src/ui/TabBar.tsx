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
          <Pulsable key={p.href} role="tab" selected={activa} label={p.etiqueta} onPress={() => onElegir(p.href)} escala={0.9} style={{ flex: 1, minWidth: 0, minHeight: 52, paddingHorizontal: 1, alignItems: "center", justifyContent: "center", gap: 3 }}>
            <Icono nombre={p.icono} size={24} color={color} trazo={activa ? 2.1 : 1.7} />
            <Text numberOfLines={1} ellipsizeMode="clip" adjustsFontSizeToFit minimumFontScale={0.8} maxFontSizeMultiplier={1.15} style={{ color, fontFamily: fonts.medium, fontSize: 10, letterSpacing: -0.1, textAlign: "center", width: "100%", fontWeight: activa ? "600" : "400" }}>{p.etiqueta}</Text>
            <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: activa ? c.accent : "transparent" }} />
          </Pulsable>
        );
      })}
    </View>
  );
}
