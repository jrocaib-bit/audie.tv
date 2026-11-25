import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fonts } from "../theme";
import { BARRA, SOMBRA_FLOTANTE, anchoPildora, margenInferiorBarra } from "./barra-flotante";
import { Icono, type NombreIcono } from "./Icono";
import { Pulsable } from "./Pulsable";
import type { Paleta } from "./tema";

export type PestanaDef = { href: string; icono: NombreIcono; etiqueta: string };

/** Fondo de la píldora: un punto más claro que la tarjeta para que se despegue del fondo y de las obras. */
export const FONDO_PILDORA = "rgba(34, 30, 26, 0.96)";
/** Las pestañas inactivas se apagan un poco respecto al texto secundario. */
const APAGADO = "rgba(183, 171, 156, 0.72)";

/** Barra de pestañas flotante: una píldora compacta y centrada, con sombra suave, sobre el contenido. */
export function TabBar({ c, pestanas, actual, onElegir }: { c: Paleta; pestanas: PestanaDef[]; actual: string | null; onElegir: (href: string) => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View pointerEvents="box-none" style={{ paddingHorizontal: BARRA.margenLateral, paddingBottom: margenInferiorBarra(insets.bottom), alignItems: "center" }}>
      <View
        accessibilityRole="tablist"
        style={{ flexDirection: "row", alignItems: "center", width: anchoPildora(pestanas.length), maxWidth: "100%", height: BARRA.alto, paddingHorizontal: BARRA.rellenoPildora, borderRadius: BARRA.radio, backgroundColor: FONDO_PILDORA, borderWidth: 1, borderColor: "rgba(244, 236, 226, 0.06)", boxShadow: SOMBRA_FLOTANTE }}
      >
        {pestanas.map((p) => {
          const activa = p.href === actual;
          const color = activa ? c.ink : APAGADO;
          return (
            <Pulsable key={p.href} role="tab" selected={activa} label={p.etiqueta} onPress={() => onElegir(p.href)} escala={0.9} style={{ width: BARRA.anchoPestana, minHeight: 52, paddingHorizontal: 1, alignItems: "center", justifyContent: "center", gap: 3 }}>
              <Icono nombre={p.icono} size={22} color={color} trazo={activa ? 2.1 : 1.7} />
              <Text numberOfLines={1} ellipsizeMode="clip" adjustsFontSizeToFit minimumFontScale={0.8} maxFontSizeMultiplier={1.15} style={{ color, fontFamily: fonts.medium, fontSize: 11, letterSpacing: -0.1, textAlign: "center", width: "100%", fontWeight: activa ? "600" : "400" }}>{p.etiqueta}</Text>
              <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: activa ? c.accent : "transparent" }} />
            </Pulsable>
          );
        })}
      </View>
    </View>
  );
}
