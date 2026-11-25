import { Text, View } from "react-native";
import type { TipoAcceso } from "../acceso";
import { fonts } from "../theme";
import { tx } from "../textos";
import { Icono } from "./Icono";
import type { Paleta } from "./tema";

/** Marca discreta de una lista: Gratis, Premium o Próximamente. */
export function Insignia({ tipo, c, lang }: { tipo: TipoAcceso; c: Paleta; lang: "es" | "en" }) {
  const t = tx(lang);
  if (tipo === "premium") {
    return (
      <View accessibilityLabel={t.premiumTag} style={{ flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 9, minHeight: 24, borderRadius: 12, backgroundColor: "rgba(224,196,138,0.14)" }}>
        <Icono nombre="estrella" size={12} color={c.accent} />
        <Text style={{ color: c.accent, fontFamily: fonts.medium, fontSize: 11, fontWeight: "700" }}>{t.premiumTag}</Text>
      </View>
    );
  }
  const gratis = tipo === "gratis";
  return (
    <View style={{ paddingHorizontal: 9, minHeight: 24, borderRadius: 12, justifyContent: "center", backgroundColor: gratis ? c.accent : "transparent", borderWidth: gratis ? 0 : 1, borderColor: c.line }}>
      <Text style={{ color: gratis ? c.accentInk : c.muted, fontFamily: fonts.medium, fontSize: 11, fontWeight: "700" }}>{gratis ? t.gratis : t.proximamente}</Text>
    </View>
  );
}
