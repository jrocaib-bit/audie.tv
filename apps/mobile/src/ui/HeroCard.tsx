import { Text, View, useWindowDimensions } from "react-native";
import { fonts } from "../theme";
import { Icono } from "./Icono";
import { ObraMarco } from "./ObraMarco";
import { ProgressBar } from "./ProgressBar";
import { Pulsable } from "./Pulsable";
import type { Paleta } from "./tema";

type Props = {
  c: Paleta;
  src: string;
  kicker: string;
  titulo: string;
  meta: string;
  fraccion?: number;
  ratio?: number;
  jugando?: boolean;
  proximamente?: string;
  etiquetaPlay: string;
  onPlay: () => void;
  onAbrir: () => void;
};

/** El episodio de hoy: obra entera, título y un botón enorme. */
export function HeroCard({ c, src, kicker, titulo, meta, fraccion = 0, ratio = 16 / 9, jugando, proximamente, etiquetaPlay, onPlay, onAbrir }: Props) {
  const ancho = useWindowDimensions().width - 42;
  const alto = Math.round(Math.min(260, Math.max(170, ancho / ratio)));
  return (
    <Pulsable onPress={onAbrir} label={titulo} escala={0.985} style={{ borderRadius: 28, backgroundColor: c.card, overflow: "visible", borderWidth: 1, borderColor: c.line }}>
      <View style={{ borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: "hidden" }}>
        <ObraMarco src={src} style={{ height: alto }} />
        <View style={{ position: "absolute", top: 16, left: 16, backgroundColor: "rgba(12,11,9,0.7)", borderRadius: 999, paddingHorizontal: 12, minHeight: 28, justifyContent: "center" }}>
          <Text style={{ color: "#F4ECE2", fontFamily: fonts.medium, fontSize: 12, letterSpacing: 1.2, textTransform: "uppercase" }}>{kicker}</Text>
        </View>
      </View>
      <View style={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: 20, gap: 6 }}>
        <View style={{ paddingRight: 84 }}>
          <Text numberOfLines={2} style={{ color: c.ink, fontFamily: fonts.serif, fontSize: 30, lineHeight: 34 }}>{titulo}</Text>
          <Text style={{ color: c.muted, fontFamily: fonts.sans, fontSize: 15, marginTop: 6 }}>{proximamente ?? meta}</Text>
        </View>
        {fraccion > 0 ? <ProgressBar fraccion={fraccion} color={c.accent} pista={c.line} alto={4} style={{ marginTop: 10 }} /> : null}
      </View>
      <Pulsable
        onPress={onPlay}
        label={etiquetaPlay}
        haptica
        escala={0.92}
        style={{ position: "absolute", right: 20, bottom: fraccion > 0 ? 36 : 28, width: 68, height: 68, borderRadius: 34, backgroundColor: c.accent, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOpacity: 0.35, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 6 }}
      >
        <Icono nombre={jugando ? "pause" : "play"} size={30} color={c.accentInk} />
      </Pulsable>
    </Pulsable>
  );
}
