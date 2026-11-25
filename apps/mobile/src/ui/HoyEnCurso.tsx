import { Modal, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { LibroEnCurso, RetoEnCurso } from "../hoy-empezados";
import type { OpcionMenu } from "../hoy-menu";
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

/** Marca discreta de lo fijado: una chincheta pequeña en el color de acento. */
export function MarcaFijado({ c, size = 13 }: { c: Paleta; size?: number }) {
  return <Icono nombre="chincheta" size={size} color={c.accent} trazo={2} />;
}

/**
 * Fila de lo empezado: obra a la izquierda, título, avance y barra, y el botón de seguir en color de acento.
 * El botón «…» de la derecha es un hermano de la parte pulsable, para no anidar botones.
 * Mantener pulsada la fila abre el mismo menú que el «…».
 */
function FilaEnCurso({ c, t, label, onPress, imagen, titulo, detalle, fraccion, opciones, fijado }: { c: Paleta; t: Textos; label: string; onPress: () => void; imagen: React.ReactNode; titulo: string; detalle: string; fraccion: number; opciones?: Opciones; fijado: boolean }) {
  return (
    <View style={{ borderRadius: SUPERFICIE.radioFila, flexDirection: "row", alignItems: "center", backgroundColor: c.card, minHeight: 88 }}>
      <Pulsable onPress={onPress} onLongPress={opciones?.onPress} label={fijado ? `${t.fijado}. ${label}` : label} style={{ flex: 1, padding: 12, paddingRight: opciones ? 4 : 12, flexDirection: "row", alignItems: "center", gap: 12, minHeight: 88 }}>
        {imagen}
        <View style={{ flex: 1, gap: 6 }}>
          <View>
            {fijado ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 2 }}>
                <MarcaFijado c={c} size={12} />
                <Text style={{ color: c.accent, fontFamily: fonts.medium, fontSize: 11, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase" }}>{t.fijado}</Text>
              </View>
            ) : null}
            <Text numberOfLines={2} style={{ color: c.ink, fontFamily: fonts.serif, fontSize: 19, lineHeight: 22 }}>{titulo}</Text>
            <Text numberOfLines={2} style={{ color: c.muted, fontFamily: fonts.sans, fontSize: 13, lineHeight: 17, marginTop: 2 }}>{detalle}</Text>
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

export function TarjetaLibro({ c, t, libro, fijado = false, onPress, onOpciones }: { c: Paleta; t: Textos; libro: LibroEnCurso; fijado?: boolean; onPress: () => void; onOpciones?: () => void }) {
  const detalle = detalleLibro(t, libro);
  return (
    <FilaEnCurso
      c={c}
      t={t}
      fijado={fijado}
      label={`${t.continuarLectura}. ${libro.titulo}. ${detalle}`}
      onPress={onPress}
      imagen={libro.volumen ? <PortadaLibro volumen={libro.volumen} titulo={libro.titulo} ancho={42} /> : <IconoCirculo nombre="libro" c={c} size={56} />}
      titulo={libro.titulo}
      detalle={detalle}
      fraccion={libro.fraccion}
      opciones={onOpciones ? { label: llenar(t.opciones, { nombre: libro.titulo }), onPress: onOpciones } : undefined}
    />
  );
}

export function TarjetaReto({ c, t, reto, fijado = false, onPress, onOpciones }: { c: Paleta; t: Textos; reto: RetoEnCurso; fijado?: boolean; onPress: () => void; onOpciones?: () => void }) {
  const detalle = detalleReto(t, reto);
  const estilo = { width: 56, height: 56, borderRadius: 14 };
  return (
    <FilaEnCurso
      c={c}
      t={t}
      fijado={fijado}
      label={`${t.seguirReto}. ${reto.titulo}. ${detalle}`}
      onPress={onPress}
      imagen={reto.sinObra || !reto.src ? <PlacaMarca monograma={monogramaDe(reto.titulo)} size={56} style={estilo} /> : <ObraMarco src={reto.src} style={estilo} />}
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
  fijado = false,
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
  fijado?: boolean;
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
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          {fijado ? <MarcaFijado c={c} /> : null}
          <Text numberOfLines={1} style={{ flexShrink: 1, color: c.ink, fontFamily: sangria ? fonts.sans : fonts.serif, fontSize: sangria ? 15 : 18 }}>{nombre}</Text>
        </View>
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
        <Text numberOfLines={3} style={{ color: c.muted, fontFamily: fonts.sans, fontSize: 13 }}>{nota}</Text>
      </View>
      <Pulsable onPress={onMostrar} label={llenar(t.volverMostrarNombre, { nombre })} escala={0.94} style={{ minHeight: 44, paddingHorizontal: 14, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: SUPERFICIE.suave }}>
        <Text style={{ color: c.accent, fontFamily: fonts.medium, fontSize: 14, fontWeight: "600" }}>{t.volverMostrar}</Text>
      </Pulsable>
    </View>
  );
}

/** Lo que enseña el menú contextual: cabecera con la obra, el título y el avance, y sus opciones. */
export type MenuHoy = { titulo: string; detalle: string; imagen?: React.ReactNode; opciones: OpcionMenu[]; nota: string };

const ICONO_OPCION: Record<OpcionMenu, NombreIcono> = {
  fijar: "chincheta",
  desfijar: "sin-chincheta",
  "ir-libro": "libro",
  "ir-reto": "retos",
  "ver-camino": "caminos",
  "editar-hoy": "deslizadores",
  quitar: "cerrar",
};

export function textoOpcion(t: Textos, opcion: OpcionMenu): string {
  switch (opcion) {
    case "fijar": return t.fijarArriba;
    case "desfijar": return t.desfijar;
    case "ir-libro": return t.irLibro;
    case "ir-reto": return t.irReto;
    case "ver-camino": return t.verCamino;
    case "editar-hoy": return t.editarHoy;
    case "quitar": return t.quitarDeHoy;
  }
}

function FilaOpcion({ c, t, opcion, primera, onPress }: { c: Paleta; t: Textos; opcion: OpcionMenu; primera: boolean; onPress: () => void }) {
  return (
    <Pulsable onPress={onPress} label={textoOpcion(t, opcion)} haptica escala={0.98} style={{ minHeight: 54, flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 16, borderTopWidth: primera ? 0 : 1, borderTopColor: c.line }}>
      <Icono nombre={ICONO_OPCION[opcion]} size={22} color={c.accent} />
      <Text style={{ flex: 1, color: c.ink, fontFamily: fonts.sans, fontSize: 17 }}>{textoOpcion(t, opcion)}</Text>
    </Pulsable>
  );
}

/**
 * Menú contextual de Hoy en una hoja: se abre al mantener pulsada una tarjeta o el episodio, o con el «…».
 * Las opciones van en un grupo y «Quitar de Hoy» en otro, con la nota de qué pasa después.
 * Pulsar fuera o «Cancelar» la cierra.
 */
export function HojaMenu({ c, t, menu, onElegir, onCerrar }: { c: Paleta; t: Textos; menu: MenuHoy | null; onElegir: (opcion: OpcionMenu) => void; onCerrar: () => void }) {
  const reducir = useMovimientoReducido();
  const inferior = useSafeAreaInsets().bottom;
  const grupo = menu ? menu.opciones.filter((o) => o !== "quitar") : [];
  const conQuitar = menu ? menu.opciones.includes("quitar") : false;
  const caja = { borderRadius: SUPERFICIE.radioFila, backgroundColor: SUPERFICIE.suave, overflow: "hidden" as const };
  return (
    <Modal visible={menu !== null} transparent animationType={reducir ? "fade" : "slide"} onRequestClose={onCerrar} accessibilityViewIsModal>
      <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.55)" }}>
        <Pressable accessibilityRole="button" accessibilityLabel={t.cerrar} onPress={onCerrar} style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }} />
        {menu ? (
          <View style={{ backgroundColor: c.card, borderTopLeftRadius: SUPERFICIE.radio, borderTopRightRadius: SUPERFICIE.radio, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20 + inferior, gap: 14 }}>
            <View style={{ alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: c.line }} />
            <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
              {menu.imagen}
              <View style={{ flex: 1, gap: 4 }}>
                <Text accessibilityRole="header" numberOfLines={2} style={{ color: c.ink, fontFamily: fonts.serif, fontSize: 22, lineHeight: 26 }}>{menu.titulo}</Text>
                <Text numberOfLines={2} style={{ color: c.muted, fontFamily: fonts.sans, fontSize: 13 }}>{menu.detalle}</Text>
              </View>
            </View>
            <View style={caja}>
              {grupo.map((o, i) => (
                <FilaOpcion key={o} c={c} t={t} opcion={o} primera={i === 0} onPress={() => onElegir(o)} />
              ))}
            </View>
            {conQuitar ? (
              <View style={{ gap: 8 }}>
                <View style={caja}>
                  <FilaOpcion c={c} t={t} opcion="quitar" primera onPress={() => onElegir("quitar")} />
                </View>
                <Text style={{ color: c.muted, fontFamily: fonts.sans, fontSize: 13, lineHeight: 18, paddingHorizontal: 4 }}>{menu.nota}</Text>
              </View>
            ) : null}
            <Boton c={c} secundario texto={t.cancelar} onPress={onCerrar} />
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

/** Aviso flotante breve con «Deshacer», encima de la barra de pestañas. */
export function AvisoDeshacer({ c, t, texto, abajo, onDeshacer }: { c: Paleta; t: Textos; texto: string; abajo: number; onDeshacer?: () => void }) {
  return (
    <View accessibilityLiveRegion="polite" style={{ position: "absolute", left: 16, right: 16, bottom: abajo, flexDirection: "row", alignItems: "center", gap: 10, minHeight: 52, paddingLeft: 16, paddingRight: 6, borderRadius: 26, backgroundColor: "#2A2520", borderWidth: 1, borderColor: c.line }}>
      <Text numberOfLines={2} style={{ flex: 1, color: c.ink, fontFamily: fonts.sans, fontSize: 15 }}>{texto}</Text>
      {onDeshacer ? (
        <Pulsable onPress={onDeshacer} label={t.deshacer} escala={0.94} style={{ minHeight: 44, paddingHorizontal: 14, borderRadius: 22, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: c.accent, fontFamily: fonts.medium, fontSize: 15, fontWeight: "700" }}>{t.deshacer}</Text>
        </Pulsable>
      ) : null}
    </View>
  );
}
