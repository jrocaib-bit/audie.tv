import { LinearGradient } from "expo-linear-gradient";
import { Text, View, type StyleProp, type ViewStyle } from "react-native";
import { fonts } from "../theme";

/** Placa de marca para retos sin pintura todavía: oscuro y oro, con un monograma en Gazpacho. */
export function PlacaMarca({ monograma, style, size = 56 }: { monograma: string; style?: StyleProp<ViewStyle>; size?: number }) {
  return (
    <View style={[{ overflow: "hidden", backgroundColor: "#0C0B09", alignItems: "center", justifyContent: "center" }, style]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <LinearGradient colors={["#2A2218", "#14110D", "#0C0B09"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} />
      <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, borderWidth: 1, borderColor: "rgba(201,169,110,0.25)", borderRadius: 0 }} />
      <Text style={{ color: "#C9A96E", fontFamily: fonts.serif, fontSize: size, lineHeight: size * 1.15, letterSpacing: 1 }}>{monograma}</Text>
    </View>
  );
}

export function monogramaDe(titulo: string): string {
  return titulo
    .split(/\s+/)
    .filter((p) => p.length > 2)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}
