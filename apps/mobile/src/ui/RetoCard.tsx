import { Text, View } from "react-native";
import { fonts } from "../theme";
import { ObraMarco } from "./ObraMarco";
import { PlacaMarca, monogramaDe } from "./PlacaMarca";
import { ProgressBar } from "./ProgressBar";
import { Pulsable } from "./Pulsable";
import type { Paleta } from "./tema";

type Props = {
  c: Paleta;
  titulo: string;
  src: string;
  hechos: number;
  total: number;
  fraccion: number;
  de: string;
  fechas: string;
  chip: { texto: string; activo: boolean };
  destacado?: boolean;
  sinObra?: boolean;
  onPress: () => void;
};

export function ChipEstado({ c, texto, activo }: { c: Paleta; texto: string; activo: boolean }) {
  return (
    <View style={{ alignSelf: "flex-start", paddingHorizontal: 10, minHeight: 26, borderRadius: 13, justifyContent: "center", backgroundColor: activo ? c.accent : "transparent", borderWidth: activo ? 0 : 1, borderColor: c.line }}>
      <Text style={{ color: activo ? c.accentInk : c.muted, fontFamily: fonts.medium, fontSize: 12, fontWeight: "700" }}>{texto}</Text>
    </View>
  );
}

/** Meta de temporada. La destacada lleva la obra arriba; el resto, en miniatura. */
export function RetoCard({ c, titulo, src, hechos, total, fraccion, de, fechas, chip, destacado, sinObra, onPress }: Props) {
  if (destacado) {
    return (
      <Pulsable onPress={onPress} label={titulo} haptica escala={0.985} style={{ borderRadius: 28, backgroundColor: c.card, borderWidth: 1.5, borderColor: c.accent, overflow: "hidden" }}>
        {sinObra ? <PlacaMarca monograma={monogramaDe(titulo)} size={64} style={{ height: 180 }} /> : <ObraMarco src={src} style={{ height: 180 }} />}
        <View style={{ padding: 20, gap: 10 }}>
          <ChipEstado c={c} {...chip} />
          <Text style={{ color: c.ink, fontFamily: fonts.serif, fontSize: 28, lineHeight: 32 }}>{titulo}</Text>
          <Text style={{ color: c.muted, fontFamily: fonts.sans, fontSize: 14 }}>{fechas}</Text>
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
            <Text style={{ color: c.ink, fontFamily: fonts.serif, fontSize: 40, lineHeight: 44 }}>{hechos}</Text>
            <Text style={{ color: c.muted, fontFamily: fonts.sans, fontSize: 16 }}>{de} {total}</Text>
          </View>
          <ProgressBar fraccion={fraccion} color={c.accent} pista={c.line} alto={6} />
        </View>
      </Pulsable>
    );
  }
  return (
    <Pulsable onPress={onPress} label={titulo} haptica style={{ borderRadius: 24, backgroundColor: c.card, borderWidth: 1, borderColor: c.line, padding: 12, minHeight: 108, flexDirection: "row", gap: 14, alignItems: "center" }}>
      {sinObra ? <PlacaMarca monograma={monogramaDe(titulo)} size={34} style={{ width: 84, height: 84, borderRadius: 16 }} /> : <ObraMarco src={src} style={{ width: 84, height: 84, borderRadius: 16 }} />}
      <View style={{ flex: 1, gap: 5 }}>
        <Text numberOfLines={2} style={{ color: c.ink, fontFamily: fonts.serif, fontSize: 20, lineHeight: 24 }}>{titulo}</Text>
        <Text style={{ color: c.muted, fontFamily: fonts.sans, fontSize: 13 }}>{fechas} · {hechos} {de} {total}</Text>
        <ChipEstado c={c} {...chip} />
      </View>
    </Pulsable>
  );
}
