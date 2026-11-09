import { StyleSheet } from "react-native";

export const light = {
  bg: "#f3ecdf",
  ink: "#161310",
  muted: "#5e564c",
  card: "#faf6ef",
  line: "#e4d8c8",
  accent: "#7a5428",
  accentInk: "#fbf6ee",
  gallery: "#0c0b09",
};

export const dark = {
  bg: "#100e0c",
  ink: "#f4ece2",
  muted: "#b7ab9c",
  card: "#1b1815",
  line: "#2e2924",
  accent: "#e0c48a",
  accentInk: "#1a140c",
  gallery: "#070605",
};

export const fonts = {
  serif: "Fraunces_600SemiBold",
  sans: "Outfit_400Regular",
  medium: "Outfit_500Medium",
};

export const ui = StyleSheet.create({
  screen: { flexGrow: 1, paddingHorizontal: 22, paddingTop: 12, paddingBottom: 120, gap: 16 },
  kicker: { fontFamily: fonts.medium, fontSize: 12, letterSpacing: 2, textTransform: "uppercase" },
  title: { fontFamily: fonts.serif, fontSize: 42, lineHeight: 48 },
  body: { fontFamily: fonts.sans, fontSize: 16, lineHeight: 24 },
  button: { minHeight: 48, borderRadius: 999, paddingHorizontal: 18, alignItems: "center", justifyContent: "center", alignSelf: "flex-start" },
  buttonText: { fontFamily: fonts.medium, fontSize: 16 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
});
