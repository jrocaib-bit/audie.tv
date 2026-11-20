import { useEffect, useRef } from "react";
import { Animated, ScrollView, Text, View } from "react-native";
import { fonts } from "../theme";
import { Icono } from "./Icono";
import { ObraMarco } from "./ObraMarco";
import { PlacaMarca } from "./PlacaMarca";
import { Pulsable } from "./Pulsable";
import { hapticoExito, useMovimientoReducido, type Paleta } from "./tema";

export type NodoDia = { dia: number; src: string; hecho: boolean; hoy: boolean; quieto: boolean; etiqueta: string };

const ANCHO = 64;
const SEP = 6;
const PASO = ANCHO + SEP;
const PAD = 20;

function Nodo({ c, nodo, seleccionado, monograma, etiquetaHoy, primero, ultimo, siguienteHecho, onElegir }: { c: Paleta; nodo: NodoDia; seleccionado: boolean; monograma: string; etiquetaHoy: string; primero: boolean; ultimo: boolean; siguienteHecho: boolean; onElegir: () => void }) {
  const reducir = useMovimientoReducido();
  const pop = useRef(new Animated.Value(nodo.hecho ? 1 : 0)).current;
  const antes = useRef(nodo.hecho);
  useEffect(() => {
    if (nodo.hecho && !antes.current) {
      hapticoExito();
      if (reducir) pop.setValue(1);
      else Animated.spring(pop, { toValue: 1, friction: 4, tension: 170, useNativeDriver: true }).start();
    }
    if (!nodo.hecho) pop.setValue(0);
    antes.current = nodo.hecho;
  }, [nodo.hecho, pop, reducir]);

  const lado = seleccionado ? 60 : nodo.hoy ? 56 : 52;
  const borde = seleccionado ? c.accent : nodo.hoy ? c.accent : c.line;
  const trazoBorde = seleccionado ? 2.5 : nodo.hoy ? 1.5 : 1;
  const linea = (activa: boolean) => (activa ? c.accent : c.line);
  return (
    <Pulsable onPress={onElegir} label={nodo.etiqueta} selected={seleccionado} escala={0.94} style={{ width: ANCHO, minHeight: 92, alignItems: "center", justifyContent: "flex-start" }}>
      <View style={{ width: ANCHO, height: 64, alignItems: "center", justifyContent: "center", opacity: nodo.quieto && !seleccionado ? 0.6 : 1 }}>
        {primero ? null : <View style={{ position: "absolute", left: 0, width: ANCHO / 2, height: 2, backgroundColor: linea(nodo.hecho) }} />}
        {ultimo ? null : <View style={{ position: "absolute", right: 0, width: ANCHO / 2, height: 2, backgroundColor: linea(nodo.hecho && siguienteHecho) }} />}
        <View style={{ width: lado, height: lado, borderRadius: 14, borderWidth: trazoBorde, borderColor: borde, overflow: "hidden", backgroundColor: "#0C0B09" }}>
          {nodo.src ? <ObraMarco src={nodo.src} desenfoque={8} style={{ width: "100%", height: "100%" }} /> : <PlacaMarca monograma={monograma} size={lado * 0.4} style={{ width: "100%", height: "100%" }} />}
          <Animated.View pointerEvents="none" style={{ position: "absolute", right: 3, bottom: 3, width: 20, height: 20, borderRadius: 10, backgroundColor: c.accent, borderWidth: 2, borderColor: c.bg, alignItems: "center", justifyContent: "center", opacity: pop, transform: [{ scale: pop }] }}>
            <Icono nombre="check" size={11} color={c.accentInk} trazo={3} />
          </Animated.View>
        </View>
      </View>
      <Text style={{ marginTop: 6, color: nodo.hoy ? c.accent : seleccionado ? c.ink : c.muted, fontFamily: fonts.medium, fontSize: 12, fontWeight: nodo.hoy || seleccionado ? "700" : "400" }}>{nodo.hoy ? etiquetaHoy : nodo.dia}</Text>
    </Pulsable>
  );
}

/** Camino de días: una miniatura por día, en horizontal, con el seleccionado centrado. */
export function CaminoDias({ c, nodos, seleccionado, onElegir, vista, monograma, etiquetaHoy, etiqueta }: { c: Paleta; nodos: NodoDia[]; seleccionado: number; onElegir: (i: number) => void; vista: number; monograma: string; etiquetaHoy: string; etiqueta: string }) {
  const ref = useRef<any>(null) // eslint-disable-line @typescript-eslint/no-explicit-any -- el tipo de instancia de ScrollView no se exporta;
  const reducir = useMovimientoReducido();
  const primera = useRef(true);
  useEffect(() => {
    const x = Math.max(0, PAD + seleccionado * PASO + ANCHO / 2 - vista / 2);
    ref.current?.scrollTo({ x, animated: !primera.current && !reducir });
    primera.current = false;
  }, [seleccionado, vista, reducir]);
  return (
    <View accessibilityLabel={etiqueta}>
      <ScrollView ref={ref} horizontal showsHorizontalScrollIndicator={false} decelerationRate="fast" contentContainerStyle={{ paddingHorizontal: PAD, gap: SEP }}>
        {nodos.map((nodo, i) => (
          <Nodo key={nodo.dia} c={c} nodo={nodo} seleccionado={i === seleccionado} monograma={monograma} etiquetaHoy={etiquetaHoy} primero={i === 0} ultimo={i === nodos.length - 1} siguienteHecho={Boolean(nodos[i + 1]?.hecho)} onElegir={() => onElegir(i)} />
        ))}
      </ScrollView>
    </View>
  );
}
