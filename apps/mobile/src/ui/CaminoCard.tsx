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
  const borde = activo ? "#C9A96E" : "#2E2924";
  const marca = activo && etiquetaActivo ? (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, minHeight: 26, borderRadius: 13, backgroundColor: c.accent }}>
      <Icono nombre="check" size={13} color={c.accentInk} trazo={2.4} />
      <Text style={{ color: c.accentInk, fontFamily: fonts.medium, fontSize: 12, fontWeight: "700" }}>{etiquetaActivo}</Text>
    </View>
  ) : null;
  if (principal) {
    return (
      <Pulsable onPress={onPress} label={nombre} haptica escala={0.985} style={{ borderRadius: 28, backgroundColor: "#1B1815", borderWidth: 1.5, borderColor: borde, overflow: "hidden" }}>
        <View style={{ padding: 10, paddingBottom: 0 }}>
          <ObraMarco src={src} style={{ height: 200, borderRadius: 16 }} />
        </View>
        <View style={{ padding: 20, gap: 12 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
            <Text numberOfLines={2} style={{ color: c.ink, fontFamily: fonts.serif, fontSize: 28, lineHeight: 32, flexShrink: 1 }}>{nombre}</Text>
            {marca}
          </View>
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
            <Text style={{ color: c.ink, fontFamily: fonts.serif, fontSize: 44, lineHeight: 48 }}>{hechos}</Text>
            <Text style={{ color: c.muted, fontFamily: fonts.sans, fontSize: 17 }}>{de} {total}</Text>
          </View>
          <ProgressBar fraccion={fraccion} color={c.accent} pista={c.line} alto={8} />
          <View style={{ minHeight: 48, borderRadius: 24, backgroundColor: "#E0C48A", alignItems: "center", justifyContent: "center", marginTop: 4 }}>
            <Text style={{ color: "#100E0C", fontFamily: fonts.medium, fontSize: 16, fontWeight: "700" }}>{accion}</Text>
          </View>
        </View>
      </Pulsable>
    );
  }
  return (
    <Pulsable onPress={onPress} label={nombre} haptica style={{ borderRadius: 24, backgroundColor: "#1B1815", borderWidth: 1.5, borderColor: borde, padding: 12, minHeight: 108, flexDirection: "row", gap: 14, alignItems: "center" }}>
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
