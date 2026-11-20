import { ActivityIndicator, Text, View } from "react-native";
import { fonts } from "../theme";
import { Icono } from "./Icono";
import { ObraMarco } from "./ObraMarco";
import { ProgressBar } from "./ProgressBar";
import { Pulsable } from "./Pulsable";
import type { Paleta } from "./tema";

type Props = { c: Paleta; src: string; titulo: string; subtitulo: string; fraccion: number; jugando: boolean; etiquetaPlay: string; cargando?: boolean; error?: string; onToggle: () => void; onAbrir: () => void };

export function MiniPlayer({ c, src, titulo, subtitulo, fraccion, jugando, etiquetaPlay, cargando, error, onToggle, onAbrir }: Props) {
  return (
    <View style={{ paddingHorizontal: 10, paddingBottom: 8, backgroundColor: c.bg }}>
      <Pulsable onPress={onAbrir} label={titulo} escala={0.985} style={{ borderRadius: 20, backgroundColor: c.card, borderWidth: 1, borderColor: c.line, overflow: "hidden" }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 8, paddingRight: 12 }}>
          <ObraMarco src={src} style={{ width: 52, height: 52, borderRadius: 12 }} desenfoque={12} />
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={{ color: c.ink, fontFamily: fonts.serif, fontSize: 18 }}>{titulo}</Text>
            <Text numberOfLines={1} style={{ color: c.muted, fontFamily: fonts.sans, fontSize: 13 }}>{error ?? subtitulo}</Text>
          </View>
          <Pulsable onPress={onToggle} label={etiquetaPlay} haptica escala={0.88} hitSlop={6} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: c.accent, alignItems: "center", justifyContent: "center" }}>
            {cargando ? <ActivityIndicator color={c.accentInk} /> : <Icono nombre={jugando ? "pause" : "play"} size={22} color={c.accentInk} />}
          </Pulsable>
        </View>
        <ProgressBar fraccion={fraccion} color={c.accent} pista={c.line} alto={3} />
      </Pulsable>
    </View>
  );
}
