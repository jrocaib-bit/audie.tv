import { Text, View } from "react-native";
import type { TipoAcceso } from "../acceso";
import { fonts } from "../theme";
import { Icono } from "./Icono";
import { Insignia } from "./Insignia";
import { Pulsable } from "./Pulsable";
import type { Paleta } from "./tema";

export type Relacionado = { id: string; titulo: string; disponible: boolean };
export type DatosDia = {
  dia: number;
  titulo: string;
  minutos?: number;
  tipo: TipoAcceso;
  diaLiturgico?: string;
  referencias?: { profecia: string; cumplimiento: string }[];
  descripcion?: string;
  relacionados?: Relacionado[];
};

/** El día elegido: número y minutos, título y, en los retos de profecías, referencias, descripción y episodios relacionados. */
export function DiaDetalle({ c, lang, datos, etiquetaDia, etiquetaProximamente, onRelacionado }: { c: Paleta; lang: "es" | "en"; datos: DatosDia; etiquetaDia: string; etiquetaProximamente: string; onRelacionado: (id: string) => void }) {
  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Text style={{ flex: 1, color: c.muted, fontFamily: fonts.medium, fontSize: 13, letterSpacing: 1.2, textTransform: "uppercase" }}>
          {etiquetaDia} {datos.dia}{datos.minutos ? ` · ${datos.minutos} min` : ""}
        </Text>
        <Insignia tipo={datos.tipo} c={c} lang={lang} />
      </View>
      <Text accessibilityRole="header" style={{ color: c.ink, fontFamily: fonts.serif, fontSize: 30, lineHeight: 34 }}>{datos.titulo}</Text>
      {datos.diaLiturgico ? <Text style={{ color: c.muted, fontFamily: fonts.sans, fontSize: 14 }}>{datos.diaLiturgico}</Text> : null}
      {(datos.referencias?.length ?? 0) > 0 ? (
        <View style={{ gap: 6 }}>
          {(datos.referencias ?? []).map((r) => (
            <Text key={`${r.profecia}-${r.cumplimiento}`} style={{ color: c.accent, fontFamily: fonts.medium, fontSize: 15 }}>{r.cumplimiento && r.cumplimiento !== "—" ? `${r.profecia} → ${r.cumplimiento}` : r.profecia}</Text>
          ))}
        </View>
      ) : null}
      {datos.descripcion ? <Text style={{ color: c.muted, fontFamily: fonts.sans, fontSize: 14, lineHeight: 20 }}>{datos.descripcion}</Text> : null}
      {(datos.relacionados?.length ?? 0) > 0 ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {(datos.relacionados ?? []).map((rel) => (
            <Pulsable key={rel.id} onPress={rel.disponible ? () => onRelacionado(rel.id) : undefined} disabled={!rel.disponible} label={`${rel.titulo}${rel.disponible ? "" : `. ${etiquetaProximamente}`}`} escala={0.96} style={{ minHeight: 44, paddingHorizontal: 14, borderRadius: 22, flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderColor: c.line, backgroundColor: "rgba(244,236,226,0.05)", opacity: rel.disponible ? 1 : 0.6 }}>
              {rel.disponible ? <Icono nombre="play" size={14} color={c.accent} /> : null}
              <Text numberOfLines={1} style={{ color: c.ink, fontFamily: fonts.medium, fontSize: 14, maxWidth: 200 }}>{rel.titulo}</Text>
              {rel.disponible ? null : <Text style={{ color: c.muted, fontFamily: fonts.medium, fontSize: 11 }}>{etiquetaProximamente}</Text>}
            </Pulsable>
          ))}
        </View>
      ) : null}
    </View>
  );
}
