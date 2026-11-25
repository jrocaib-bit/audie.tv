import { Modal, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { LibroEnCurso, RetoEnCurso, TarjetaEnCurso } from "../hoy-empezados";
import { PortadaLibro } from "../libros/portada";
import { llenar, th } from "../textos-hoy";
import { fonts } from "../theme";
import { Boton, IconoCirculo, SUPERFICIE } from "./Basicos";
import { Icono, type NombreIcono } from "./Icono";
import { ObraMarco } from "./ObraMarco";
import { PlacaMarca, monogramaDe } from "./PlacaMarca";
import { ProgressBar } from "./ProgressBar";
import { Pulsable } from "./Pulsable";
import { useMovimientoReducido, type Paleta } from "./tema";

type Textos = ReturnType<typeof th>;

type Opciones = { label: string; onPress: () => void };

/**
 * Fila de lo empezado: obra a la izquierda, título, avance y barra, y el botón de seguir en color de acento.
 * El botón «…» de la derecha es un hermano de la parte pulsable, para no anidar botones.
 */
function FilaEnCurso({ c, label, onPress, imagen, titulo, detalle, fraccion, opciones }: { c: Paleta; label: string; onPress: () => void; imagen: React.ReactNode; titulo: string; detalle: string; fraccion: number; opciones?: Opciones }) {
  return (
    <View style={{ borderRadius: SUPERFICIE.radioFila, flexDirection: "row", alignItems: "center", backgroundColor: c.card, minHeight: 88 }}>
      <Pulsable onPress={onPress} label={label} style={{ flex: 1, padding: 12, paddingRight: opciones ? 4 : 12, flexDirection: "row", alignItems: "center", gap: 12, minHeight: 88 }}>
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
      {opciones ? (
        <Pulsable onPress={opciones.onPress} label={opciones.label} escala={0.9} style={{ width: 44, height: 88, marginRight: 2, alignItems: "center", justifyContent: "center" }}>
          <Icono nombre="mas" size={20} color={c.muted} />
        </Pulsable>
      ) : null}
    </View>
  );
}

export function detalleLibro(t: Textos, libro: LibroEnCurso): string {
  return libro.capitulo > 0 ? llenar(t.capitulo, { n: libro.capitulo, total: libro.total }) : t.libroComentado;
}

export function detalleReto(t: Textos, reto: RetoEnCurso): string {
  return llenar(t.retoAvance, { n: reto.dia, h: reto.hechos, t: reto.total });
}

export function TarjetaLibro({ c, t, libro, onPress, onOpciones }: { c: Paleta; t: Textos; libro: LibroEnCurso; onPress: () => void; onOpciones?: () => void }) {
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
      opciones={onOpciones ? { label: llenar(t.opciones, { nombre: libro.titulo }), onPress: onOpciones } : undefined}
    />
  );
}

export function TarjetaReto({ c, t, reto, onPress, onOpciones }: { c: Paleta; t: Textos; reto: RetoEnCurso; onPress: () => void; onOpciones?: () => void }) {
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
      opciones={onOpciones ? { label: llenar(t.opciones, { nombre: reto.titulo }), onPress: onOpciones } : undefined}
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

/**
 * Fila del modo Editar Hoy: nombre, nota y controles de 44 para subir y bajar.
 * Los bloques llevan además mostrar u ocultar (onAlternar). Las tarjetas llevan quitar de Hoy (onQuitar).
 */
export function FilaEditable({
  c,
  t,
  nombre,
  nota,
  oculto = false,
  subir,
  bajar,
  onAlternar,
  onQuitar,
  onSubir,
  onBajar,
  sangria = false,
}: {
  c: Paleta;
  t: Textos;
  nombre: string;
  nota?: string;
  oculto?: boolean;
  subir: boolean;
  bajar: boolean;
  onAlternar?: () => void;
  onQuitar?: () => void;
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
      {onAlternar ? <BotonControl c={c} nombre={oculto ? "oculto" : "ojo"} label={llenar(oculto ? t.mostrar : t.ocultar, { nombre })} onPress={onAlternar} activo={!oculto} /> : null}
      {onQuitar ? <BotonControl c={c} nombre="cerrar" label={llenar(t.quitarNombre, { nombre })} onPress={onQuitar} /> : null}
    </View>
  );
}

/** Fila de la lista «Quitado de Hoy» del modo Editar Hoy, con «Volver a mostrar». */
export function FilaQuitada({ c, t, nombre, nota, onMostrar }: { c: Paleta; t: Textos; nombre: string; nota: string; onMostrar: () => void }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8, paddingLeft: 28, paddingRight: 4, minHeight: 64 }}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text numberOfLines={1} style={{ color: c.ink, fontFamily: fonts.sans, fontSize: 15, opacity: 0.7 }}>{nombre}</Text>
        <Text numberOfLines={2} style={{ color: c.muted, fontFamily: fonts.sans, fontSize: 13 }}>{nota}</Text>
      </View>
      <Pulsable onPress={onMostrar} label={llenar(t.volverMostrarNombre, { nombre })} escala={0.94} style={{ minHeight: 44, paddingHorizontal: 14, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: SUPERFICIE.suave }}>
        <Text style={{ color: c.accent, fontFamily: fonts.medium, fontSize: 14, fontWeight: "600" }}>{t.volverMostrar}</Text>
      </Pulsable>
    </View>
  );
}

/** Hoja breve con «Quitar de Hoy» para una tarjeta de lo empezado. Pulsar fuera o «Cancelar» la cierra. */
export function HojaQuitar({ c, t, tarjeta, onQuitar, onCerrar }: { c: Paleta; t: Textos; tarjeta: TarjetaEnCurso | null; onQuitar: (tarjeta: TarjetaEnCurso) => void; onCerrar: () => void }) {
  const reducir = useMovimientoReducido();
  const inferior = useSafeAreaInsets().bottom;
  return (
    <Modal visible={tarjeta !== null} transparent animationType={reducir ? "fade" : "slide"} onRequestClose={onCerrar} accessibilityViewIsModal>
      <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.55)" }}>
        <Pressable accessibilityRole="button" accessibilityLabel={t.cerrar} onPress={onCerrar} style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }} />
        {tarjeta ? (
          <View style={{ backgroundColor: c.card, borderTopLeftRadius: SUPERFICIE.radio, borderTopRightRadius: SUPERFICIE.radio, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20 + inferior, gap: 14 }}>
            <View style={{ alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: c.line }} />
            <View style={{ gap: 4 }}>
              <Text accessibilityRole="header" numberOfLines={2} style={{ color: c.ink, fontFamily: fonts.serif, fontSize: 22 }}>{tarjeta.titulo}</Text>
              <Text numberOfLines={1} style={{ color: c.muted, fontFamily: fonts.sans, fontSize: 13 }}>{tarjeta.tipo === "libro" ? detalleLibro(t, tarjeta) : detalleReto(t, tarjeta)}</Text>
            </View>
            <Text style={{ color: c.muted, fontFamily: fonts.sans, fontSize: 15, lineHeight: 21 }}>{t.quitarCuerpo}</Text>
            <Boton c={c} icono="cerrar" texto={t.quitarDeHoy} onPress={() => onQuitar(tarjeta)} />
            <Boton c={c} secundario texto={t.cancelar} onPress={onCerrar} />
          </View>
        ) : null}
      </View>
    </Modal>
  );
}
