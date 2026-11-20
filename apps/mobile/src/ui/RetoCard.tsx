import { ScrollView, Text, View } from "react-native";
import { diasParaEmpezar, indiceDeHoy } from "../reto-dias";
import { marcadorHoy, tramosDelAnio, fechaCorta, type TarjetaReto, type TiempoLiturgico } from "../temporadas";
import type { Textos } from "../textos";
import { fonts } from "../theme";
import { Boton } from "./Basicos";
import { Icono } from "./Icono";
import { ObraMarco } from "./ObraMarco";
import { PlacaMarca, monogramaDe } from "./PlacaMarca";
import { ProgressBar } from "./ProgressBar";
import { Pulsable } from "./Pulsable";
import type { Paleta } from "./tema";

type Chip = { texto: string; activo: boolean };
type Comun = { c: Paleta; t: Textos; reto: TarjetaReto; chip: Chip; hoyIso: string; onPress: () => void };

export function ChipEstado({ c, texto, activo }: { c: Paleta; texto: string; activo: boolean }) {
  return (
    <View style={{ alignSelf: "flex-start", paddingHorizontal: 10, minHeight: 26, borderRadius: 13, justifyContent: "center", backgroundColor: activo ? c.accent : "transparent", borderWidth: activo ? 0 : 1, borderColor: c.line }}>
      <Text style={{ color: activo ? c.accentInk : c.muted, fontFamily: fonts.medium, fontSize: 12, fontWeight: "700" }}>{texto}</Text>
    </View>
  );
}

/** «Faltan N días» mientras el reto no ha empezado. */
export function cuentaAtrasDe(t: Textos, reto: Pick<TarjetaReto, "estado" | "inicio">, hoyIso: string): string | null {
  if (reto.estado !== "empieza") return null;
  const n = diasParaEmpezar(reto.inicio, hoyIso);
  if (n <= 0) return null;
  return n === 1 ? t.faltaUnDia : t.faltanDias.replace("{n}", String(n));
}

/** El día que toca: hoy si el reto está en curso; si no, el primero pendiente. */
export function diaActual(reto: Pick<TarjetaReto, "hechos" | "total">): number {
  return Math.min(reto.total, reto.hechos + 1);
}

/** Obra entera (nunca recortada) o placa de marca si el reto aún no tiene pintura. */
function Portada({ reto, style, placa = 64 }: { reto: TarjetaReto; style: object; placa?: number }) {
  return reto.sinObra || !reto.src ? <PlacaMarca monograma={monogramaDe(reto.titulo)} size={placa} style={style} /> : <ObraMarco src={reto.src} style={style} />;
}

/** Sello discreto sobre la obra cuando el reto está terminado. */
function Sello({ c, texto }: { c: Paleta; texto: string }) {
  return (
    <View style={{ position: "absolute", top: 10, right: 10, flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, minHeight: 28, borderRadius: 14, backgroundColor: "rgba(12,11,9,0.78)", borderWidth: 1, borderColor: c.accent }}>
      <Icono nombre="check" size={12} color={c.accent} trazo={3} />
      <Text style={{ color: c.accent, fontFamily: fonts.medium, fontSize: 12, fontWeight: "700" }}>{texto}</Text>
    </View>
  );
}

/** Un punto por día: los hechos se encienden en oro, el de hoy lleva aro. */
export function PuntosDia({ c, total, hechos, hoy }: { c: Paleta; total: number; hechos: number; hoy: number | null }) {
  const lado = total > 30 ? 6 : 9;
  const hueco = total > 30 ? 4 : 6;
  return (
    <View accessible accessibilityLabel={`${hechos} / ${total}`} style={{ flexDirection: "row", flexWrap: "wrap", gap: hueco }}>
      {Array.from({ length: total }, (_, i) => {
        const hecho = i < hechos;
        const esHoy = hoy === i;
        return <View key={i} style={{ width: lado, height: lado, borderRadius: lado / 2, backgroundColor: hecho ? c.accent : "transparent", borderWidth: hecho ? 0 : esHoy ? 1.5 : 1, borderColor: esHoy ? c.accent : c.line }} />;
      })}
    </View>
  );
}

/** Cartel héroe: obra grande, título, «Día N de M», puntos y un botón dorado. */
export function CartelHeroe({ c, t, reto, chip, hoyIso, onPress, botonTexto }: Comun & { botonTexto: string }) {
  const terminado = reto.estado === "terminado";
  const cuenta = cuentaAtrasDe(t, reto, hoyIso);
  const dia = diaActual(reto);
  return (
    <View style={{ borderRadius: 28, backgroundColor: c.card, borderWidth: 1, borderColor: c.line, overflow: "hidden" }}>
      <Pulsable onPress={onPress} label={reto.titulo} escala={0.99}>
        <View>
          <Portada reto={reto} style={{ height: 280 }} placa={96} />
          {terminado ? <Sello c={c} texto={t.terminado} /> : null}
        </View>
      </Pulsable>
      <View style={{ padding: 20, gap: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <ChipEstado c={c} {...chip} />
          {cuenta ? <Text style={{ color: c.accent, fontFamily: fonts.medium, fontSize: 14, fontWeight: "700" }}>{cuenta}</Text> : null}
        </View>
        <Text accessibilityRole="header" style={{ color: c.ink, fontFamily: fonts.serif, fontSize: 32, lineHeight: 36 }}>{reto.titulo}</Text>
        <Text style={{ color: c.muted, fontFamily: fonts.medium, fontSize: 15 }}>{t.diaNDeM.replace("{n}", String(dia)).replace("{m}", String(reto.total))} · {reto.fechas}</Text>
        <PuntosDia c={c} total={reto.total} hechos={reto.hechos} hoy={indiceDeHoy(reto.inicio, hoyIso, reto.total)} />
        <Boton c={c} texto={botonTexto} onPress={onPress} />
      </View>
    </View>
  );
}

export const ANCHO_RAIL = 156;
export const ALTO_RAIL = 208; // 3:4

/** Cartel vertical 3:4 con la obra completa, para el rail «Siguientes». */
export function CartelRail({ c, t, reto, chip, hoyIso, onPress }: Comun) {
  const cuenta = cuentaAtrasDe(t, reto, hoyIso);
  return (
    <Pulsable onPress={onPress} label={`${reto.titulo}. ${chip.texto}`} haptica escala={0.97} style={{ width: ANCHO_RAIL, gap: 8 }}>
      <View style={{ borderRadius: 20, overflow: "hidden", borderWidth: 1, borderColor: c.line }}>
        <Portada reto={reto} style={{ width: ANCHO_RAIL - 2, height: ALTO_RAIL }} placa={44} />
        {reto.estado === "terminado" ? <Sello c={c} texto={t.terminado} /> : null}
      </View>
      <Text numberOfLines={2} style={{ color: c.ink, fontFamily: fonts.serif, fontSize: 19, lineHeight: 22 }}>{reto.titulo}</Text>
      <Text numberOfLines={1} style={{ color: cuenta ? c.accent : c.muted, fontFamily: fonts.medium, fontSize: 13 }}>{cuenta ?? reto.fechas}</Text>
    </Pulsable>
  );
}

/** Celda de la cuadrícula de 2 columnas: obra completa, título, estado y progreso. */
export function CartelCelda({ c, t, reto, chip, hoyIso, onPress, ancho }: Comun & { ancho: number }) {
  const cuenta = cuentaAtrasDe(t, reto, hoyIso);
  return (
    <Pulsable onPress={onPress} label={`${reto.titulo}. ${chip.texto}`} haptica escala={0.97} style={{ width: ancho, gap: 8 }}>
      <View style={{ borderRadius: 20, overflow: "hidden", borderWidth: 1, borderColor: c.line }}>
        <Portada reto={reto} style={{ width: ancho - 2, height: Math.round((ancho - 2) * 1.1) }} placa={48} />
        {reto.estado === "terminado" ? <Sello c={c} texto={t.terminado} /> : null}
      </View>
      <Text numberOfLines={2} style={{ color: c.ink, fontFamily: fonts.serif, fontSize: 19, lineHeight: 22 }}>{reto.titulo}</Text>
      {reto.estado === "en-curso" ? <ProgressBar fraccion={reto.fraccion} color={c.accent} pista={c.line} alto={4} /> : null}
      <Text numberOfLines={1} style={{ color: cuenta ? c.accent : c.muted, fontFamily: fonts.medium, fontSize: 13 }}>{reto.estado === "en-curso" ? `${reto.hechos} ${t.de} ${reto.total}` : cuenta ?? reto.fechas}</Text>
    </Pulsable>
  );
}

const ANCHO_TRAMO = 96;
const PAD_LINEA = 20;

function nombreDeTiempo(t: Textos, tiempo: TiempoLiturgico): string {
  switch (tiempo) {
    case "adviento": return t.adviento;
    case "navidad": return t.tNavidad;
    case "cuaresma": return t.tCuaresma;
    case "semana-santa": return t.tSemanaSanta;
    case "pascua": return t.tPascua;
    default: return t.tOrdinario;
  }
}

/** Línea del año litúrgico en horizontal, con un marcador «hoy». */
export function LineaDelAnio({ c, t, lang, hoyIso, vista }: { c: Paleta; t: Textos; lang: "es" | "en"; hoyIso: string; vista: number }) {
  const tramos = tramosDelAnio();
  const hoy = marcadorHoy(tramos, hoyIso);
  const xHoy = (hoy.indice + hoy.fraccion) * ANCHO_TRAMO;
  const inicioScroll = Math.max(0, PAD_LINEA + xHoy - vista / 3);
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentOffset={{ x: inicioScroll, y: 0 }} accessibilityLabel={t.temporadas} contentContainerStyle={{ paddingHorizontal: PAD_LINEA }}>
      <View style={{ paddingTop: 30 }}>
        <View style={{ flexDirection: "row" }}>
          {tramos.map((tramo, i) => {
            const pasado = tramo.fin < hoyIso;
            const actual = i === hoy.indice && hoyIso >= tramo.inicio && hoyIso <= tramo.fin;
            return (
              <View key={tramo.id} accessible accessibilityLabel={`${nombreDeTiempo(t, tramo.tiempo)}, ${fechaCorta(tramo.inicio, lang)}`} style={{ width: ANCHO_TRAMO, paddingRight: 4, gap: 8 }}>
                <View style={{ height: 6, borderRadius: 3, backgroundColor: actual ? c.accent : pasado ? c.muted : c.line }} />
                <Text numberOfLines={1} style={{ color: actual ? c.ink : c.muted, fontFamily: fonts.medium, fontSize: 13, fontWeight: actual ? "700" : "400" }}>{nombreDeTiempo(t, tramo.tiempo)}</Text>
                <Text numberOfLines={1} style={{ color: c.muted, fontFamily: fonts.sans, fontSize: 12 }}>{fechaCorta(tramo.inicio, lang)}</Text>
              </View>
            );
          })}
        </View>
        <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ position: "absolute", top: 0, left: Math.max(0, xHoy - 22), width: 44, alignItems: "center" }}>
          <Text style={{ color: c.accent, fontFamily: fonts.medium, fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1 }}>{t.hoy}</Text>
          <View style={{ width: 2, height: 10, backgroundColor: c.accent }} />
        </View>
      </View>
    </ScrollView>
  );
}
