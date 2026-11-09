import { Image } from "react-native";

const marca = require("../assets/marca/marca-192.png");
const wordmarkClaro = require("../assets/marca/audite_wordmark_blanco.png");
const wordmarkOscuro = require("../assets/marca/audite_wordmark_negro.png");

export function Mark(_props: { color: string; paper: string }) {
  return <Image source={marca} style={{ width: 32, height: 32 }} accessibilityLabel="Audite" />;
}

export function Wordmark({ color }: { color: string }) {
  const sobreClaro = color.replace("#", "").toLowerCase() === "161310";
  return (
    <Image
      source={sobreClaro ? wordmarkOscuro : wordmarkClaro}
      style={{ height: 26, width: 108 }}
      resizeMode="contain"
      accessibilityLabel="Audite"
    />
  );
}
