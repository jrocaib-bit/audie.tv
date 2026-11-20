import { Text, View } from "react-native";
import { fonts } from "../theme";
import { Icono } from "./Icono";
import { ObraMarco } from "./ObraMarco";
import { ProgressBar } from "./ProgressBar";
import { Pulsable } from "./Pulsable";
import type { Paleta } from "./tema";

type Props = {
  c: Paleta;
  nombre: string;
  src: string;
  hechos: number;
  total: number;
  fraccion: number;
  de: string;
  accion: string;
  activo?: boolean;
  principal?: boolean;
  etiquetaActivo?: string;
  onPress: () => void;
};

/** Tarjeta de camino. La principal lleva la obra arriba; el resto, en miniatura. */
export function CaminoCard({ c, nombre, src, hechos, total, fraccion, de, accion, activo, principal, etiquetaActivo, onPress }: Props) {
  const borde = activo ? c.accent : c.line;
  const marca = activo && etiquetaActivo ? (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      <Icono nombre="check" size={14} color={c.accent} />
      <Text style={{ color: c.accent, fontFamily: fonts.medium, fontSize: 13 }}>{etiquetaActivo}</Text>
    </View>
  ) : null;
  if (principal) {
    return (
      <Pulsable onPress={onPress} label={nombre} haptica escala={0.985} style={{ borderRadius: 28, backgroundColor: c.card, borderWidth: 1.5, borderColor: borde, overflow: "hidden" }}>
        <ObraMarco src={src} style={{ height: 200 }} />
        <View style={{ padding: 20, gap: 12 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ color: c.ink, fontFamily: fonts.serif, fontSize: 30, lineHeight: 34 }}>{nombre}</Text>
            {marca}
          </View>
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
            <Text style={{ color: c.ink, fontFamily: fonts.serif, fontSize: 44, lineHeight: 48 }}>{hechos}</Text>
            <Text style={{ color: c.muted, fontFamily: fonts.sans, fontSize: 17 }}>{de} {total}</Text>
          </View>
          <ProgressBar fraccion={fraccion} color={c.accent} pista={c.line} alto={8} />
          <Text style={{ color: c.accent, fontFamily: fonts.medium, fontSize: 16, fontWeight: "600" }}>{accion}</Text>
        </View>
      </Pulsable>
    );
  }
  return (
    <Pulsable onPress={onPress} label={nombre} haptica style={{ borderRadius: 24, backgroundColor: c.card, borderWidth: 1.5, borderColor: borde, padding: 12, flexDirection: "row", gap: 14, alignItems: "center" }}>
      <ObraMarco src={src} style={{ width: 84, height: 84, borderRadius: 16 }} />
      <View style={{ flex: 1, gap: 6 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text numberOfLines={1} style={{ color: c.ink, fontFamily: fonts.serif, fontSize: 22, flexShrink: 1 }}>{nombre}</Text>
          {marca}
        </View>
        <Text style={{ color: c.muted, fontFamily: fonts.sans, fontSize: 14 }}>{hechos} {de} {total}</Text>
        <ProgressBar fraccion={fraccion} color={c.accent} pista={c.line} alto={5} />
      </View>
      <Text style={{ color: c.accent, fontFamily: fonts.medium, fontSize: 14, fontWeight: "600" }}>{accion}</Text>
    </Pulsable>
  );
}
