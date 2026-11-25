import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ActivityIndicator, Text, View } from "react-native";
import { fonts } from "../theme";
import { BARRA, SOMBRA_FLOTANTE } from "./barra-flotante";
import { Icono } from "./Icono";
import { ObraMarco } from "./ObraMarco";
import { ProgressBar } from "./ProgressBar";
import { Pulsable } from "./Pulsable";
import type { Paleta } from "./tema";

type Props = { c: Paleta; sobrePestanas?: boolean; src: string; titulo: string; subtitulo: string; fraccion: number; jugando: boolean; etiquetaPlay: string; cargando?: boolean; error?: string; haySiguiente?: boolean; onSiguiente?: () => void; etiquetaSiguiente?: string; onToggle: () => void; onAbrir: () => void };

export function MiniPlayer({ c, sobrePestanas = true, src, titulo, subtitulo, fraccion, jugando, etiquetaPlay, cargando, error, haySiguiente, onSiguiente, etiquetaSiguiente, onToggle, onAbrir }: Props) {
  const insets = useSafeAreaInsets();
  // Sobre las pestañas flota encima de la píldora, que ya lleva el margen inferior del sistema.
  const abajo = sobrePestanas ? BARRA.separacionMini : Math.max(insets.bottom, 8);
  return (
    <View pointerEvents="box-none" style={{ paddingHorizontal: sobrePestanas ? BARRA.margenLateral : 10, paddingBottom: abajo, backgroundColor: sobrePestanas ? "transparent" : c.bg }}>
      <Pulsable onPress={onAbrir} label={titulo} escala={0.985} style={{ height: sobrePestanas ? BARRA.altoMini : undefined, justifyContent: "space-between", borderRadius: 22, backgroundColor: "#1B1815", borderWidth: 1, borderColor: "#2E2924", overflow: "hidden", boxShadow: sobrePestanas ? SOMBRA_FLOTANTE : undefined }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 8, paddingRight: 12 }}>
          <ObraMarco src={src} style={{ width: 52, height: 52, borderRadius: 12 }} desenfoque={12} />
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={{ color: c.ink, fontFamily: fonts.serif, fontSize: 18 }}>{titulo}</Text>
            <Text numberOfLines={1} style={{ color: c.muted, fontFamily: fonts.sans, fontSize: 13 }}>{error ?? subtitulo}</Text>
          </View>
          <Pulsable onPress={onToggle} label={etiquetaPlay} haptica escala={0.88} hitSlop={6} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "#E0C48A", alignItems: "center", justifyContent: "center" }}>
            {cargando ? <ActivityIndicator color="#100E0C" /> : <Icono nombre={jugando ? "pause" : "play"} size={22} color="#100E0C" />}
          </Pulsable>
          {onSiguiente ? (
            <Pulsable onPress={onSiguiente} disabled={!haySiguiente} label={etiquetaSiguiente} haptica escala={0.88} hitSlop={6} style={{ width: 40, height: 44, alignItems: "center", justifyContent: "center", opacity: haySiguiente ? 1 : 0.3 }}>
              <Icono nombre="siguiente" size={24} color={c.ink} />
            </Pulsable>
          ) : null}
        </View>
        <ProgressBar fraccion={fraccion} color="#C9A96E" pista="#2E2924" alto={3} />
      </Pulsable>
    </View>
  );
}
