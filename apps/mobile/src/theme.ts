import { Platform, StyleSheet } from "react-native";
import { fuenteGazpacho } from "./gazpacho";

export const light = {
  bg: "#F3ECDF",
  ink: "#161310",
  muted: "#5E564C",
  card: "#FAF6EF",
  line: "#E4D8C8",
  accent: "#8A6432",
  accentInk: "#F3ECDF",
  gallery: "#0C0B09",
  brand: "#8A6432",
};

export const dark = {
  bg: "#100E0C",
  ink: "#F4ECE2",
  muted: "#B7AB9C",
  card: "#1B1815",
  line: "#2E2924",
  accent: "#E0C48A",
  accentInk: "#100E0C",
  gallery: "#0C0B09",
  brand: "#C9A96E",
};

/** Nombres de los tokens de identidad v2.1. SF Pro no se incrusta. */
export const fontTokens = {
  display: "Gazpacho",
  secundaria: "Inter",
  iosSystem: '-apple-system, "SF Pro Text", "SF Pro Display", system-ui, sans-serif',
} as const;

const texto = Platform.OS === "ios" ? undefined : fontTokens.secundaria;
const display = fuenteGazpacho ? fontTokens.display : "Georgia";

export const fonts = {
  serif: display,
  sans: texto,
  medium: texto,
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
