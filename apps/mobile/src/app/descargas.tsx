import { Text, View } from "react-native";
import { fonts } from "../theme";

export default function Descargas() {
  return (
    <View style={{ flex: 1, backgroundColor: "#100E0C", padding: 22 }}>
      <Text style={{ color: "#F4ECE2", fontFamily: fonts.serif, fontSize: 40 }}>Escucha</Text>
      <Text style={{ color: "#B7AB9C", marginTop: 12 }}>La escucha necesita conexión.</Text>
    </View>
  );
}
