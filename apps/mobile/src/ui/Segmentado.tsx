import { Text, View } from "react-native";
import { fonts } from "../theme";
import { SUPERFICIE } from "./Basicos";
import { Pulsable } from "./Pulsable";
import type { Paleta } from "./tema";

export type OpcionSegmento = { href: string; etiqueta: string };

/** Control segmentado de Audite: un carril suave con dos o más opciones de 44 de alto. La activa va en acento. */
export function Segmentado({ c, etiqueta, opciones, activo, onElegir }: { c: Paleta; etiqueta: string; opciones: readonly OpcionSegmento[]; activo: string; onElegir: (href: string) => void }) {
  return (
    <View accessibilityRole="tablist" accessibilityLabel={etiqueta} style={{ flexDirection: "row", alignSelf: "center", width: "100%", maxWidth: 360, padding: 4, gap: 4, borderRadius: 999, backgroundColor: SUPERFICIE.suave }}>
      {opciones.map((o) => {
        const sel = o.href === activo;
        return (
          <Pulsable key={o.href} role="tab" selected={sel} label={o.etiqueta} haptica={!sel} escala={0.96} onPress={() => onElegir(o.href)} style={{ flex: 1, minWidth: 0, minHeight: 44, paddingHorizontal: 12, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: sel ? c.accent : "transparent" }}>
            <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85} maxFontSizeMultiplier={1.3} style={{ color: sel ? c.accentInk : c.muted, fontFamily: fonts.medium, fontSize: 15, fontWeight: sel ? "600" : "400" }}>{o.etiqueta}</Text>
          </Pulsable>
        );
      })}
    </View>
  );
}
