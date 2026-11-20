import { Image, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { fuenteDeObra } from "../obras-bundle";

/** La obra entera (contain) sobre su propio desenfoque. Nunca se recorta. */
export function ObraMarco({ src, style, alt = "", desenfoque = 24 }: { src: string; style?: StyleProp<ViewStyle>; alt?: string; desenfoque?: number }) {
  const fuente = src ? fuenteDeObra(src) : null;
  return (
    <View style={[{ overflow: "hidden", backgroundColor: "#0C0B09" }, style]}>
      {fuente ? (
        <>
          <Image source={fuente} accessibilityElementsHidden blurRadius={desenfoque} resizeMode="cover" style={[StyleSheet.absoluteFill, { opacity: 0.85 }]} />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(12,11,9,0.22)" }]} />
          <Image source={fuente} accessibilityLabel={alt || undefined} accessible={Boolean(alt)} resizeMode="contain" style={StyleSheet.absoluteFill} />
        </>
      ) : null}
    </View>
  );
}
