import { useRouter } from "expo-router";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fonts } from "../theme";
import { BotonRedondo } from "./Basicos";
import { type Paleta } from "./tema";

/** Cabecera propia de las pantallas con pestañas. */
export function ScreenHeader({ c, kicker, titulo, derecha }: { c: Paleta; kicker?: string; titulo: string; derecha?: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  return (
    <View style={{ paddingTop: insets.top + 14, paddingHorizontal: 20, paddingBottom: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, minHeight: 72 }}>
      <View style={{ flex: 1, gap: 2 }}>
        {kicker ? <Text style={{ color: c.muted, fontFamily: fonts.medium, fontSize: 12, letterSpacing: 1.2, textTransform: "uppercase" }}>{kicker}</Text> : null}
        <Text accessibilityRole="header" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={{ color: c.ink, fontFamily: fonts.serif, fontSize: 32, lineHeight: 38 }}>{titulo}</Text>
      </View>
      {derecha ?? <BotonRedondo c={c} nombre="usuario" label="Ajustes" onPress={() => router.push("/ajustes")} />}
    </View>
  );
}
