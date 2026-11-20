import { useEffect, useRef } from "react";
import { Animated, Pressable, Text, View } from "react-native";
import { fonts } from "../theme";
import { Icono, type NombreIcono } from "./Icono";
import { Pulsable } from "./Pulsable";
import type { Paleta } from "./tema";

/** Grupo de filas con esquinas redondeadas, como en una app de banca. */
export function Grupo({ c, titulo, children }: { c: Paleta; titulo?: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 8 }}>
      {titulo ? <Text style={{ color: c.muted, fontFamily: fonts.medium, fontSize: 13, letterSpacing: 1, textTransform: "uppercase", paddingHorizontal: 4 }}>{titulo}</Text> : null}
      <View style={{ borderRadius: 24, backgroundColor: c.card, borderWidth: 1, borderColor: c.line, overflow: "hidden" }}>{children}</View>
    </View>
  );
}

type FilaProps = { c: Paleta; icono?: NombreIcono; titulo: string; valor?: string; onPress?: () => void; derecha?: React.ReactNode; ultima?: boolean; peligro?: boolean };

export function Fila({ c, icono, titulo, valor, onPress, derecha, ultima, peligro }: FilaProps) {
  const color = peligro ? "#E5867A" : c.ink;
  return (
    <Pulsable onPress={onPress} disabled={!onPress} label={valor ? `${titulo}, ${valor}` : titulo} escala={0.99} style={{ minHeight: 56, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 14, borderBottomWidth: ultima ? 0 : 1, borderBottomColor: c.line }}>
      {icono ? <Icono nombre={icono} size={22} color={peligro ? color : c.accent} /> : null}
      <Text style={{ flex: 1, color, fontFamily: fonts.medium, fontSize: 16 }}>{titulo}</Text>
      {valor ? <Text style={{ color: c.muted, fontFamily: fonts.sans, fontSize: 15 }}>{valor}</Text> : null}
      {derecha}
      {onPress && !derecha ? <Icono nombre="chevron" size={18} color={c.muted} /> : null}
    </Pulsable>
  );
}

/** Selector segmentado. */
export function Segmentos<T extends string | number>({ c, opciones, valor, onElegir, lleno }: { c: Paleta; opciones: { id: T; texto: string }[]; valor: T; onElegir: (id: T) => void; lleno?: boolean }) {
  return (
    <View style={{ flexDirection: "row", backgroundColor: c.bg, borderRadius: 999, padding: 3, alignSelf: lleno ? "stretch" : undefined }}>
      {opciones.map((o) => {
        const activo = o.id === valor;
        return (
          <Pulsable key={String(o.id)} onPress={() => onElegir(o.id)} selected={activo} label={o.texto} escala={0.94} style={{ flex: lleno ? 1 : undefined, minHeight: 44, minWidth: 44, paddingHorizontal: lleno ? 4 : 12, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: activo ? c.accent : "transparent" }}>
            <Text style={{ color: activo ? c.accentInk : c.ink, fontFamily: fonts.medium, fontSize: 14 }}>{o.texto}</Text>
          </Pulsable>
        );
      })}
    </View>
  );
}

/** Interruptor propio: oro cuando está activo. */
export function Interruptor({ c, activo, onCambiar, label }: { c: Paleta; activo: boolean; onCambiar: (valor: boolean) => void; label: string }) {
  const valor = useRef(new Animated.Value(activo ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(valor, { toValue: activo ? 1 : 0, duration: 180, useNativeDriver: true }).start();
  }, [activo, valor]);
  return (
    <Pressable accessibilityRole="switch" accessibilityLabel={label} accessibilityState={{ checked: activo }} onPress={() => onCambiar(!activo)} hitSlop={8} style={{ width: 52, height: 32, borderRadius: 16, justifyContent: "center", backgroundColor: activo ? c.accent : c.line }}>
      <Animated.View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: activo ? c.accentInk : c.ink, transform: [{ translateX: valor.interpolate({ inputRange: [0, 1], outputRange: [3, 23] }) }] }} />
    </Pressable>
  );
}
