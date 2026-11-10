import { Text, View } from "react-native";

/** Diseño del widget y de la actividad en vivo. El binario del sistema pide cuenta de desarrollador. */
export function WidgetInicio({ titulo, cita }: { titulo: string; cita: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 20, backgroundColor: "#1B1815" }}>
      <View style={{ width: 52, height: 52, borderRadius: 12, backgroundColor: "#0C0B09" }} />
      <View style={{ flex: 1 }}>
        <Text style={{ color: "#F4ECE2", fontSize: 18 }}>{titulo}</Text>
        <Text style={{ color: "#B7AB9C" }}>{cita}</Text>
      </View>
    </View>
  );
}
