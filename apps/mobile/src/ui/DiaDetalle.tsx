import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import type { TipoAcceso } from "../acceso";
import { partesDelDia } from "../dia-detalle";
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
  /** Relato del día en párrafos. Con relato, la ficha pasa a: escuchar, título, relato y «Lecturas del día» plegable. */
  narracion?: string[];
  /** Si el día se puede escuchar ya. */
  disponible?: boolean;
};

type Etiquetas = { etiquetaDia: string; etiquetaProximamente: string; etiquetaEscuchar?: string; etiquetaLecturas?: string; etiquetaEpisodios?: string };

function Referencias({ c, datos, tenue }: { c: Paleta; datos: DatosDia; tenue?: boolean }) {
  return (
    <View style={{ gap: 6 }}>
      {(datos.referencias ?? []).map((r) => (
        <Text key={`${r.profecia}-${r.cumplimiento}`} style={{ color: tenue ? c.muted : c.accent, fontFamily: fonts.medium, fontSize: tenue ? 14 : 15 }}>{r.cumplimiento && r.cumplimiento !== "—" ? `${r.profecia} → ${r.cumplimiento}` : r.profecia}</Text>
      ))}
    </View>
  );
}

function Relacionados({ c, datos, etiquetaProximamente, onRelacionado }: { c: Paleta; datos: DatosDia; etiquetaProximamente: string; onRelacionado: (id: string) => void }) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      {(datos.relacionados ?? []).map((rel) => (
        <Pulsable key={rel.id} onPress={rel.disponible ? () => onRelacionado(rel.id) : undefined} disabled={!rel.disponible} label={`${rel.titulo}${rel.disponible ? "" : `. ${etiquetaProximamente}`}`} escala={0.96} style={{ minHeight: 44, paddingHorizontal: 14, borderRadius: 22, flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderColor: c.line, backgroundColor: "rgba(244,236,226,0.05)", opacity: rel.disponible ? 1 : 0.6 }}>
          {rel.disponible ? <Icono nombre="play" size={14} color={c.accent} /> : null}
          <Text numberOfLines={1} style={{ color: c.ink, fontFamily: fonts.medium, fontSize: 14, maxWidth: 200 }}>{rel.titulo}</Text>
          {rel.disponible ? null : <Text style={{ color: c.muted, fontFamily: fonts.medium, fontSize: 11 }}>{etiquetaProximamente}</Text>}
        </Pulsable>
      ))}
    </View>
  );
}

/** El día elegido. Con relato: escuchar, título, relato y lecturas plegadas al final. Sin relato: la ficha compacta. */
export function DiaDetalle({ c, lang, datos, etiquetaDia, etiquetaProximamente, etiquetaEscuchar = "Escuchar", etiquetaLecturas = "Lecturas del día", etiquetaEpisodios = "Episodios completos", onRelacionado, onEscuchar }: Etiquetas & { c: Paleta; lang: "es" | "en"; datos: DatosDia; onRelacionado: (id: string) => void; onEscuchar?: () => void }) {
  const [abierto, setAbierto] = useState(false);
  const partes = partesDelDia(datos);
  const cabecera = (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Text style={{ flex: 1, color: c.muted, fontFamily: fonts.medium, fontSize: 13, letterSpacing: 1.2, textTransform: "uppercase" }}>
          {etiquetaDia} {datos.dia}{datos.minutos ? ` · ${datos.minutos} min` : ""}
        </Text>
        <Insignia tipo={datos.tipo} c={c} lang={lang} />
      </View>
      <Text accessibilityRole="header" style={{ color: c.ink, fontFamily: fonts.serif, fontSize: 30, lineHeight: 34 }}>{datos.titulo}</Text>
      {datos.diaLiturgico ? <Text style={{ color: c.muted, fontFamily: fonts.sans, fontSize: 14 }}>{datos.diaLiturgico}</Text> : null}
    </View>
  );

  if (!partes.includes("relato")) {
    return (
      <View style={{ gap: 10 }}>
        {cabecera}
        {partes.includes("referencias") ? <Referencias c={c} datos={datos} /> : null}
        {datos.descripcion ? <Text style={{ color: c.muted, fontFamily: fonts.sans, fontSize: 14, lineHeight: 20 }}>{datos.descripcion}</Text> : null}
        {partes.includes("relacionados") ? <Relacionados c={c} datos={datos} etiquetaProximamente={etiquetaProximamente} onRelacionado={onRelacionado} /> : null}
      </View>
    );
  }

  const disponible = Boolean(datos.disponible && onEscuchar);
  const textoEscuchar = [etiquetaEscuchar, datos.minutos ? `${datos.minutos} min` : "", disponible ? "" : etiquetaProximamente].filter(Boolean).join(" · ");
  return (
    <View style={{ gap: 16 }}>
      <Pulsable onPress={disponible ? onEscuchar : undefined} disabled={!disponible} label={textoEscuchar} style={{ minHeight: 48, borderRadius: 24, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 20, backgroundColor: disponible ? c.accent : "rgba(244,236,226,0.06)", borderWidth: disponible ? 0 : 1, borderColor: c.line }}>
        <Icono nombre="play" size={16} color={disponible ? c.accentInk : c.muted} />
        <Text style={{ color: disponible ? c.accentInk : c.muted, fontFamily: fonts.medium, fontSize: 15, fontWeight: "600" }}>{textoEscuchar}</Text>
      </Pulsable>
      {cabecera}
      <View style={{ gap: 14 }}>
        {(datos.narracion ?? []).map((parrafo, i) => (
          <Text key={i} style={{ color: c.ink, opacity: 0.92, fontFamily: fonts.sans, fontSize: 17, lineHeight: 27 }}>{parrafo}</Text>
        ))}
      </View>
      {partes.includes("lecturas") ? (
        <View style={{ borderRadius: 16, borderWidth: 1, borderColor: c.line, backgroundColor: "rgba(244,236,226,0.04)" }}>
          <Pressable onPress={() => setAbierto((v) => !v)} accessibilityRole="button" accessibilityLabel={etiquetaLecturas} accessibilityState={{ expanded: abierto }} style={{ minHeight: 48, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={{ color: c.muted, fontFamily: fonts.medium, fontSize: 14 }}>{etiquetaLecturas}</Text>
            <View style={{ transform: [{ rotate: abierto ? "180deg" : "0deg" }] }}>
              <Icono nombre="abajo" size={16} color={c.muted} />
            </View>
          </Pressable>
          {abierto ? (
            <View style={{ gap: 14, paddingHorizontal: 16, paddingBottom: 16 }}>
              {(datos.referencias?.length ?? 0) > 0 ? <Referencias c={c} datos={datos} tenue /> : null}
              {(datos.relacionados?.length ?? 0) > 0 ? (
                <View style={{ gap: 8 }}>
                  <Text style={{ color: c.muted, fontFamily: fonts.medium, fontSize: 11, letterSpacing: 1.2, textTransform: "uppercase" }}>{etiquetaEpisodios}</Text>
                  <Relacionados c={c} datos={datos} etiquetaProximamente={etiquetaProximamente} onRelacionado={onRelacionado} />
                </View>
              ) : null}
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
