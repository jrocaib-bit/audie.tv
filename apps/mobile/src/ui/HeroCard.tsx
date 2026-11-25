import { Pressable, Text, View } from "react-native";
import { fonts } from "../theme";
import { SUPERFICIE } from "./Basicos";
import { Icono } from "./Icono";
import { ObraMarco } from "./ObraMarco";
import { ProgressBar } from "./ProgressBar";
import { Pulsable } from "./Pulsable";
import type { Paleta } from "./tema";

type Props = {
  c: Paleta;
  /** Obra del episodio. Vacío cuando no hay cuadro que enseñar. */
  src?: string;
  kicker: string;
  titulo: string;
  subtitulo?: string;
  /** «Día 5 de 516». */
  dia?: string;
  /** Avance del camino, de 0 a 1. */
  fraccionCamino?: number;
  ratio?: number;
  aviso?: string;
  jugando?: boolean;
  etiquetaAccion: string;
  /** Con audio es un play. Sin audio es una salida a elegir otro camino. */
  tipoAccion: "play" | "camino";
  onAccion: () => void;
  /** Pulsación larga en cualquier punto de la tarjeta: abre el menú del episodio. El «…» de fuera es su alternativa accesible. */
  onMantener?: () => void;
};

/** La respuesta a «qué escucho hoy»: el episodio pendiente del camino y una acción grande. */
export function HeroCard({ c, src, kicker, titulo, subtitulo, dia, fraccionCamino = 0, ratio = 16 / 9, aviso, jugando, etiquetaAccion, tipoAccion, onAccion, onMantener }: Props) {
  const proporcion = Math.max(0.75, Math.min(1.85, ratio));
  const play = tipoAccion === "play";
  return (
    <Pressable accessible={false} onLongPress={onMantener} delayLongPress={450} disabled={!onMantener} style={{ borderRadius: SUPERFICIE.radio, backgroundColor: c.card, overflow: "hidden" }}>
      {src ? <ObraMarco src={src} style={{ width: "100%", aspectRatio: proporcion }} /> : null}
      <View style={{ padding: 20, gap: 14 }}>
        <View style={{ gap: 6 }}>
          <Text style={{ color: c.accent, fontFamily: fonts.medium, fontSize: 12, fontWeight: "600", letterSpacing: 1.2, textTransform: "uppercase" }}>{kicker}</Text>
          <Text accessibilityRole="header" style={{ color: c.ink, fontFamily: fonts.serif, fontSize: 30, lineHeight: 35 }}>{titulo}</Text>
          {subtitulo ? <Text style={{ color: c.muted, fontFamily: fonts.sans, fontSize: 16, lineHeight: 22 }}>{subtitulo}</Text> : null}
          {aviso ? <Text style={{ color: c.ink, fontFamily: fonts.sans, fontSize: 16, lineHeight: 22, marginTop: 4 }}>{aviso}</Text> : null}
        </View>
        {dia ? (
          <View style={{ gap: 8 }} accessible accessibilityLabel={dia}>
            <Text style={{ color: c.muted, fontFamily: fonts.medium, fontSize: 13 }}>{dia}</Text>
            <ProgressBar fraccion={fraccionCamino} color={c.accent} pista={c.line} alto={4} />
          </View>
        ) : null}
        <Pulsable
          onPress={onAccion}
          label={etiquetaAccion}
          haptica
          escala={0.98}
          style={{ minHeight: 58, borderRadius: 29, backgroundColor: play ? c.accent : "transparent", borderWidth: play ? 0 : 1.5, borderColor: c.accent, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingHorizontal: 20 }}
        >
          {play ? <Icono nombre={jugando ? "pause" : "play"} size={24} color={c.accentInk} /> : null}
          <Text style={{ color: play ? c.accentInk : c.accent, fontFamily: fonts.medium, fontSize: 18, fontWeight: "700" }}>{etiquetaAccion}</Text>
        </Pulsable>
      </View>
    </Pressable>
  );
}
