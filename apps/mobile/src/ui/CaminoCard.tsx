import { Text, View } from "react-native";
import { fonts } from "../theme";
import { SUPERFICIE } from "./Basicos";
import { Icono } from "./Icono";
import { ObraMarco } from "./ObraMarco";
import { ProgressBar } from "./ProgressBar";
import { Pulsable } from "./Pulsable";
import type { Paleta } from "./tema";

type Base = {
  c: Paleta;
  nombre: string;
  descripcion: string;
  duracion: string;
  /** «Todos los episodios tienen audio» y similares. */
  audio: string;
  /** «4 de 22 episodios escuchados». Vacío si aún no se empezó. */
  avance: string;
  fraccion: number;
};

function Cabecera({ c, nombre, descripcion, duracion }: Pick<Base, "c" | "nombre" | "descripcion" | "duracion">) {
  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
        <Text accessibilityRole="header" style={{ color: c.ink, fontFamily: fonts.serif, fontSize: 26, lineHeight: 31, flexShrink: 1 }}>{nombre}</Text>
        <Text style={{ color: c.accent, fontFamily: fonts.medium, fontSize: 14, fontWeight: "600" }}>{duracion}</Text>
      </View>
      <Text style={{ color: c.muted, fontFamily: fonts.sans, fontSize: 15, lineHeight: 21 }}>{descripcion}</Text>
    </View>
  );
}

type ActualProps = Base & {
  src: string;
  siguiente?: { titulo: string; subtitulo: string; etiqueta: string };
  /** Texto cuando el siguiente no tiene audio o el camino está completo. */
  nota?: string;
  etiquetaEscuchar?: string;
  etiquetaVolver: string;
  onEscuchar?: () => void;
  onVolver: () => void;
};

/** Mi camino: la tarjeta destacada con progreso, siguiente episodio y acción. */
export function CaminoActualCard({ c, nombre, descripcion, duracion, audio, avance, fraccion, src, siguiente, nota, etiquetaEscuchar, etiquetaVolver, onEscuchar, onVolver }: ActualProps) {
  return (
    <View style={{ borderRadius: SUPERFICIE.radio, backgroundColor: c.card, overflow: "hidden" }}>
      <ObraMarco src={src} style={{ height: 170 }} />
      <View style={{ padding: 20, gap: 16 }}>
        <Cabecera c={c} nombre={nombre} descripcion={descripcion} duracion={duracion} />
        <View style={{ gap: 8 }}>
          <Text style={{ color: c.ink, fontFamily: fonts.medium, fontSize: 14 }}>{avance}</Text>
          <ProgressBar fraccion={fraccion} color={c.accent} pista={c.line} alto={6} />
          <Text style={{ color: c.muted, fontFamily: fonts.sans, fontSize: 13 }}>{audio}</Text>
        </View>
        {siguiente ? (
          <View style={{ gap: 2, padding: 14, borderRadius: 18, backgroundColor: SUPERFICIE.suave }}>
            <Text style={{ color: c.accent, fontFamily: fonts.medium, fontSize: 12, fontWeight: "600", letterSpacing: 1.2, textTransform: "uppercase" }}>{siguiente.etiqueta}</Text>
            <Text style={{ color: c.ink, fontFamily: fonts.serif, fontSize: 21, lineHeight: 26 }}>{siguiente.titulo}</Text>
            <Text style={{ color: c.muted, fontFamily: fonts.sans, fontSize: 15 }}>{siguiente.subtitulo}</Text>
          </View>
        ) : null}
        {nota ? <Text style={{ color: c.ink, fontFamily: fonts.sans, fontSize: 15, lineHeight: 21, padding: 14, borderRadius: 18, backgroundColor: SUPERFICIE.suave }}>{nota}</Text> : null}
        <View style={{ gap: 4 }}>
          {onEscuchar && etiquetaEscuchar ? (
            <Pulsable onPress={onEscuchar} label={etiquetaEscuchar} haptica escala={0.98} style={{ minHeight: 54, borderRadius: 27, backgroundColor: c.accent, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 }}>
              <Icono nombre="play" size={22} color={c.accentInk} />
              <Text style={{ color: c.accentInk, fontFamily: fonts.medium, fontSize: 17, fontWeight: "700" }}>{etiquetaEscuchar}</Text>
            </Pulsable>
          ) : null}
          <Pulsable onPress={onVolver} label={etiquetaVolver} escala={0.98} style={{ minHeight: 48, borderRadius: 24, borderWidth: onEscuchar ? 0 : 1.5, borderColor: c.accent, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: c.accent, fontFamily: fonts.medium, fontSize: 16, fontWeight: "600" }}>{etiquetaVolver}</Text>
          </Pulsable>
        </View>
      </View>
    </View>
  );
}

type OpcionProps = Base & { etiquetaElegir: string; onElegir: () => void; /** Sin audio: se muestra la etiqueta y no hay botón ni acción. */ proximamente?: string };

/** Otro camino: nombre, duración, una línea de alcance y un botón claro. */
export function CaminoCard({ c, nombre, descripcion, duracion, audio, avance, fraccion, etiquetaElegir, onElegir, proximamente }: OpcionProps) {
  return (
    <View style={{ borderRadius: SUPERFICIE.radioFila, opacity: proximamente ? 0.85 : 1, backgroundColor: c.card, padding: 18, gap: 14 }}>
      <Cabecera c={c} nombre={nombre} descripcion={descripcion} duracion={duracion} />
      {proximamente ? (
        <View accessible accessibilityLabel={proximamente} style={{ minHeight: 44, borderRadius: 22, backgroundColor: SUPERFICIE.suave, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: c.muted, fontFamily: fonts.medium, fontSize: 15, fontWeight: "600" }}>{proximamente}</Text>
        </View>
      ) : (
        <>
      <View style={{ gap: 6 }}>
        {avance ? (
          <>
            <Text style={{ color: c.ink, fontFamily: fonts.medium, fontSize: 14 }}>{avance}</Text>
            <ProgressBar fraccion={fraccion} color={c.accent} pista={c.line} alto={5} />
          </>
        ) : null}
        <Text style={{ color: c.muted, fontFamily: fonts.sans, fontSize: 13 }}>{audio}</Text>
      </View>
      <Pulsable onPress={onElegir} label={`${etiquetaElegir}: ${nombre}`} haptica escala={0.98} style={{ minHeight: 48, borderRadius: 24, backgroundColor: SUPERFICIE.circulo, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: c.accent, fontFamily: fonts.medium, fontSize: 16, fontWeight: "600" }}>{etiquetaElegir}</Text>
      </Pulsable>
        </>
      )}
    </View>
  );
}