import { Text, View, type StyleProp, type ViewStyle } from "react-native";
import { fonts } from "../theme";
import { Icono, type NombreIcono } from "./Icono";
import { Pulsable } from "./Pulsable";
import type { Paleta } from "./tema";

export const ESPACIO = 8;

export function Titulo({ children, c, size = 28 }: { children: React.ReactNode; c: Paleta; size?: number }) {
  return (
    <Text accessibilityRole="header" style={{ color: c.ink, fontFamily: fonts.serif, fontSize: size, lineHeight: size * 1.12 }}>
      {children}
    </Text>
  );
}

/** Título de sección con una acción pequeña opcional. */
export function Seccion({ titulo, c, accion, onAccion }: { titulo: string; c: Paleta; accion?: string; onAccion?: () => void }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" }}>
      <Titulo c={c} size={24}>{titulo}</Titulo>
      {accion ? (
        <Pulsable onPress={onAccion} label={accion} hitSlop={12} escala={0.94}>
          <Text style={{ color: c.accent, fontFamily: fonts.medium, fontSize: 14 }}>{accion}</Text>
        </Pulsable>
      ) : null}
    </View>
  );
}

export function Chip({ texto, activo, onPress, c, icono, style, proximo, etiquetaProximo }: { texto: string; activo?: boolean; onPress?: () => void; c: Paleta; icono?: NombreIcono; style?: StyleProp<ViewStyle>; proximo?: boolean; etiquetaProximo?: string }) {
  const label = proximo && etiquetaProximo ? `${texto}, ${etiquetaProximo}` : texto;
  return (
    <Pulsable
      onPress={proximo ? undefined : onPress}
      selected={activo}
      disabled={proximo}
      label={label}
      haptica={!proximo}
      escala={0.94}
      style={[
        {
          minHeight: 44,
          paddingHorizontal: 18,
          paddingVertical: proximo ? 6 : 0,
          borderRadius: 999,
          flexDirection: proximo ? "column" : "row",
          alignItems: "center",
          justifyContent: "center",
          gap: proximo ? 0 : 8,
          opacity: proximo ? 0.5 : 1,
          backgroundColor: activo ? c.accent : c.card,
          borderWidth: 1,
          borderColor: activo ? c.accent : c.line,
        },
        style,
      ]}
    >
      {icono ? <Icono nombre={icono} size={18} color={activo ? c.accentInk : c.ink} /> : null}
      <Text style={{ color: activo ? c.accentInk : c.ink, fontFamily: fonts.medium, fontSize: 15 }}>{texto}</Text>
      {proximo && etiquetaProximo ? <Text style={{ color: c.muted, fontFamily: fonts.sans, fontSize: 10 }}>{etiquetaProximo}</Text> : null}
    </Pulsable>
  );
}

/** Botón principal redondo en oro. */
export function Boton({ texto, onPress, c, style, secundario, icono }: { texto: string; onPress?: () => void; c: Paleta; style?: StyleProp<ViewStyle>; secundario?: boolean; icono?: NombreIcono }) {
  return (
    <Pulsable
      onPress={onPress}
      label={texto}
      haptica
      style={[
        {
          minHeight: 56,
          borderRadius: 999,
          paddingHorizontal: 24,
          flexDirection: "row",
          gap: 8,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: secundario ? c.card : c.accent,
          borderWidth: secundario ? 1 : 0,
          borderColor: c.line,
        },
        style,
      ]}
    >
      {icono ? <Icono nombre={icono} size={20} color={secundario ? c.ink : c.accentInk} /> : null}
      <Text style={{ color: secundario ? c.ink : c.accentInk, fontFamily: fonts.medium, fontSize: 17, fontWeight: "600" }}>{texto}</Text>
    </Pulsable>
  );
}

export function BotonRedondo({ nombre, onPress, label, c, size = 44, relleno, color }: { nombre: NombreIcono; onPress?: () => void; label: string; c: Paleta; size?: number; relleno?: boolean; color?: string }) {
  return (
    <Pulsable
      onPress={onPress}
      label={label}
      haptica
      escala={0.9}
      style={{ width: size, height: size, borderRadius: size / 2, alignItems: "center", justifyContent: "center", backgroundColor: relleno ? c.accent : c.card }}
    >
      <Icono nombre={nombre} size={Math.round(size * 0.5)} color={color ?? (relleno ? c.accentInk : c.ink)} />
    </Pulsable>
  );
}
