import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fonts } from "../theme";
import { type Paleta } from "./tema";

/** Cabecera propia de las pantallas con pestañas. */
export function ScreenHeader({ c, kicker, titulo, derecha }: { c: Paleta; kicker?: string; titulo: string; derecha?: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 20, paddingBottom: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 72 }}>
      <View style={{ flex: 1 }}>
        {kicker ? <Text style={{ color: c.muted, fontFamily: fonts.medium, fontSize: 14 }}>{kicker}</Text> : null}
        <Text accessibilityRole="header" style={{ color: c.ink, fontFamily: fonts.serif, fontSize: 34, lineHeight: 40 }}>{titulo}</Text>
      </View>
      {derecha}
    </View>
  );
}
