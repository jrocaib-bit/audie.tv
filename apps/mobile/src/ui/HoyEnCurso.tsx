import { Text, View } from "react-native";
import type { LibroEnCurso, RetoEnCurso } from "../hoy-empezados";
import { PortadaLibro } from "../libros/portada";
import { llenar, th } from "../textos-hoy";
import { fonts } from "../theme";
import { IconoCirculo, SUPERFICIE } from "./Basicos";
import { Icono, type NombreIcono } from "./Icono";
import { ObraMarco } from "./ObraMarco";
import { PlacaMarca, monogramaDe } from "./PlacaMarca";
import { ProgressBar } from "./ProgressBar";
import { Pulsable } from "./Pulsable";
import type { Paleta } from "./tema";

type Textos = ReturnType<typeof th>;

/** Fila de lo empezado: obra a la izquierda, título, avance y barra, y el botón de seguir en color de acento. */
function FilaEnCurso({ c, label, onPress, imagen, titulo, detalle, fraccion }: { c: Paleta; label: string; onPress: () => void; imagen: React.ReactNode; titulo: string; detalle: string; fraccion: number }) {
  return (
    <Pulsable onPress={onPress} label={label} style={{ borderRadius: SUPERFICIE.radioFila, padding: 12, flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: c.card, minHeight: 88 }}>
      {imagen}
      <View style={{ flex: 1, gap: 6 }}>
        <View>
          <Text numberOfLines={1} style={{ color: c.ink, fontFamily: fonts.serif, fontSize: 19 }}>{titulo}</Text>
          <Text numberOfLines={1} style={{ color: c.muted, fontFamily: fonts.sans, fontSize: 13 }}>{detalle}</Text>
        </View>
        <ProgressBar fraccion={fraccion} color={c.accent} pista={c.line} alto={4} />
      </View>
      <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: c.accent, alignItems: "center", justifyContent: "center" }}>
        <Icono nombre="chevron" size={18} color={c.accentInk} trazo={2.4} />
      </View>
    </Pulsable>
  );
}

export function detalleLibro(t: Textos, libro: LibroEnCurso): string {
  return libro.capitulo > 0 ? llenar(t.capitulo, { n: libro.capitulo, total: libro.total }) : t.libroComentado;
}

export function detalleReto(t: Textos, reto: RetoEnCurso): string {
  return llenar(t.retoAvance, { n: reto.dia, h: reto.hechos, t: reto.total });
}

export function TarjetaLibro({ c, t, libro, onPress }: { c: Paleta; t: Textos; libro: LibroEnCurso; onPress: () => void }) {
  const detalle = detalleLibro(t, libro);
  return (
    <FilaEnCurso
      c={c}
      label={`${t.continuarLectura}. ${libro.titulo}. ${detalle}`}
      onPress={onPress}
      imagen={libro.volumen ? <PortadaLibro volumen={libro.volumen} titulo={libro.titulo} ancho={42} /> : <IconoCirculo nombre="libro" c={c} size={64} />}
      titulo={libro.titulo}
      detalle={detalle}
      fraccion={libro.fraccion}
    />
  );
}

export function TarjetaReto({ c, t, reto, onPress }: { c: Paleta; t: Textos; reto: RetoEnCurso; onPress: () => void }) {
  const detalle = detalleReto(t, reto);
  const estilo = { width: 64, height: 64, borderRadius: 16 };
  return (
    <FilaEnCurso
      c={c}
      label={`${t.seguirReto}. ${reto.titulo}. ${detalle}`}
      onPress={onPress}
      imagen={reto.sinObra || !reto.src ? <PlacaMarca monograma={monogramaDe(reto.titulo)} size={64} style={estilo} /> : <ObraMarco src={reto.src} style={estilo} />}
      titulo={reto.titulo}
      detalle={detalle}
      fraccion={reto.fraccion}
    />
  );
}

function BotonControl({ c, nombre, label, onPress, disabled, activo }: { c: Paleta; nombre: NombreIcono; label: string; onPress: () => void; disabled?: boolean; activo?: boolean }) {
  return (
    <Pulsable onPress={onPress} label={label} disabled={disabled} escala={0.9} style={{ width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: activo ? SUPERFICIE.circulo : SUPERFICIE.suave, opacity: disabled ? 0.3 : 1 }}>
      <Icono nombre={nombre} size={20} color={activo ? c.accent : c.ink} />
    </Pulsable>
  );
}

/** Fila del modo Editar Hoy: nombre, nota y controles de 44 para mostrar u ocultar, subir y bajar. */
export function FilaEditable({
  c,
  t,
  nombre,
  nota,
  oculto,
  subir,
  bajar,
  onAlternar,
  onSubir,
  onBajar,
  sangria = false,
}: {
  c: Paleta;
  t: Textos;
  nombre: string;
  nota?: string;
  oculto: boolean;
  subir: boolean;
  bajar: boolean;
  onAlternar: () => void;
  onSubir: () => void;
  onBajar: () => void;
  sangria?: boolean;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 10, paddingLeft: sangria ? 28 : 16, paddingRight: 10, borderRadius: SUPERFICIE.radioFila, backgroundColor: sangria ? "transparent" : c.card, minHeight: 64 }}>
      <View style={{ flex: 1, gap: 2, opacity: oculto ? 0.5 : 1 }}>
        <Text numberOfLines={1} style={{ color: c.ink, fontFamily: sangria ? fonts.sans : fonts.serif, fontSize: sangria ? 15 : 18 }}>{nombre}</Text>
        {oculto ? (
          <Text style={{ color: c.muted, fontFamily: fonts.medium, fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1 }}>{t.oculto}</Text>
        ) : nota ? (
          <Text numberOfLines={2} style={{ color: c.muted, fontFamily: fonts.sans, fontSize: 13 }}>{nota}</Text>
        ) : null}
      </View>
      <BotonControl c={c} nombre="arriba" label={llenar(t.subir, { nombre })} onPress={onSubir} disabled={!subir} />
      <BotonControl c={c} nombre="abajo" label={llenar(t.bajar, { nombre })} onPress={onBajar} disabled={!bajar} />
      <BotonControl c={c} nombre={oculto ? "oculto" : "ojo"} label={llenar(oculto ? t.mostrar : t.ocultar, { nombre })} onPress={onAlternar} activo={!oculto} />
    </View>
  );
}
