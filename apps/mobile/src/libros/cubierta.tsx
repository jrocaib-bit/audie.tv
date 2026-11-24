import { Text, View } from "react-native";
import { LETRA } from "./estilos";

const TONOS = ["#3C2A1E", "#243028", "#4A3424", "#2A241C", "#3A2C22", "#1E2A32"];
const ROMANOS = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI"];

/** Cubierta tipográfica: número de volumen y título. Sin ilustraciones. */
export function Cubierta({ volumen, titulo, ancho = 120 }: { volumen: number; titulo: string; ancho?: number }) {
  const escala = ancho / 120;
  return (
    <View
      accessible
      accessibilityLabel={`Volumen ${ROMANOS[volumen] ?? volumen}. ${titulo}`}
      style={{ width: ancho, height: ancho * 1.5, backgroundColor: TONOS[(volumen - 1 + TONOS.length) % TONOS.length], borderWidth: 1, borderColor: "rgba(201,169,110,0.4)", borderRadius: 4, padding: 10 * escala, justifyContent: "space-between" }}
    >
      <Text style={{ color: "#C9A96E", fontSize: Math.max(8, 9 * escala), letterSpacing: 2, textTransform: "uppercase" }}>Volumen {ROMANOS[volumen] ?? volumen}</Text>
      <View>
        <View style={{ height: 1, width: "22%", backgroundColor: "rgba(201,169,110,0.7)", marginBottom: 8 * escala }} />
        <Text style={{ color: "#F4ECE2", fontFamily: LETRA, fontSize: 16 * escala, lineHeight: 18 * escala }}>{titulo}</Text>
      </View>
      <Text style={{ color: "#B7AB9C", fontSize: Math.max(7, 8 * escala), letterSpacing: 1.5, textTransform: "uppercase" }}>Audite</Text>
    </View>
  );
}
