import { Text, View } from "react-native";
import { fonts } from "../theme";
import { Icono, type NombreIcono } from "./Icono";
import { ProgressBar } from "./ProgressBar";
import { Pulsable } from "./Pulsable";
import type { Paleta } from "./tema";

/** Widget de Hoy: etiqueta arriba, número grande con su texto y un elemento inferior de altura fija. */
export function Widget({ c, icono, etiqueta, numero, sec, abajo, onPress, accent }: { c: Paleta; icono: NombreIcono; etiqueta: string; numero: number; sec: string; abajo: React.ReactNode; onPress?: () => void; accent?: boolean }) {
  return (
    <Pulsable onPress={onPress} disabled={!onPress} label={`${etiqueta}, ${numero} ${sec}`} escala={0.97} style={{ flex: 1, height: 148, borderRadius: 24, padding: 16, justifyContent: "space-between", backgroundColor: c.card, borderWidth: 1, borderColor: c.line }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <Icono nombre={icono} size={18} color={accent ? c.accent : c.muted} />
        <Text numberOfLines={1} style={{ color: c.muted, fontFamily: fonts.medium, fontSize: 14, flexShrink: 1 }}>{etiqueta}</Text>
      </View>
      <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6 }}>
        <Text style={{ color: c.ink, fontFamily: fonts.serif, fontSize: 48, lineHeight: 52 }}>{numero}</Text>
        <Text numberOfLines={1} style={{ color: c.muted, fontFamily: fonts.sans, fontSize: 14, flexShrink: 1 }}>{sec}</Text>
      </View>
      <View style={{ height: 30, justifyContent: "center" }}>{abajo}</View>
    </Pulsable>
  );
}

export function GoalCard({ c, nombre, hechos, total, fraccion, de, onAbrir }: { c: Paleta; nombre: string; hechos: number; total: number; fraccion: number; de: string; onAbrir: () => void }) {
  return (
    <Widget c={c} icono="caminos" etiqueta={nombre} numero={hechos} sec={`${de} ${total}`} onPress={onAbrir} abajo={<ProgressBar fraccion={fraccion} color={c.accent} pista={c.line} alto={5} />} />
  );
}

type Dia = { iso: string; letra: string; hecho: boolean; hoy: boolean; futuro: boolean };

export function RachaCard({ c, etiqueta, racha, dias, semana }: { c: Paleta; etiqueta: string; racha: number; dias: string; semana: Dia[] }) {
  return (
    <Widget
      c={c}
      icono="llama"
      accent={racha > 0}
      etiqueta={etiqueta}
      numero={racha}
      sec={dias}
      abajo={
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          {semana.map((d) => (
            <View key={d.iso} style={{ alignItems: "center", gap: 3 }}>
              <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: d.hecho ? c.accent : "transparent", borderWidth: d.hecho ? 0 : d.hoy ? 2 : 1, borderColor: d.hoy ? c.accent : c.line, opacity: d.futuro ? 0.5 : 1 }} />
              <Text style={{ color: d.hoy ? c.ink : c.muted, fontFamily: fonts.medium, fontSize: 10 }}>{d.letra}</Text>
            </View>
          ))}
        </View>
      }
    />
  );
}
