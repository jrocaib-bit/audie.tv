import disponibles from "../../../content/canon/03_identidad/disponibles.json";
import { Image, Text, View } from "react-native";
import { fonts } from "./theme";

const logos = disponibles as { wordmark: string | null; mark: string | null };
const contentBase = process.env.EXPO_PUBLIC_CONTENT_BASE ?? "http://127.0.0.1:43123";

function logoUri(value: string | null): string | null {
  if (!value) return null;
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  return `${contentBase}${value}`;
}

export function Mark({ color, paper }: { color: string; paper: string }) {
  const uri = logoUri(logos.mark);
  if (uri) return <Image source={{ uri }} style={{ width: 32, height: 32 }} />;
  return (
    <View style={{ width: 32, height: 32, backgroundColor: color, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ color: paper, fontFamily: fonts.serif, fontSize: 20 }}>a</Text>
    </View>
  );
}

export function Wordmark({ color }: { color: string }) {
  const uri = logoUri(logos.wordmark);
  if (uri) return <Image source={{ uri }} style={{ height: 28, width: 120 }} resizeMode="contain" />;
  return <Text style={{ color, fontFamily: fonts.serif, fontSize: 22, letterSpacing: -0.5 }}>audˈte</Text>;
}
