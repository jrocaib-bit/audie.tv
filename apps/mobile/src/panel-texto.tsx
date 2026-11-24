/**
 * Panel de texto del reproductor en la app. Mismo comportamiento que el panel web.
 * La lógica (versículo actual, sincronía, preferencias, paleta, textos) vive en @audite/domain.
 */
import {
  CLAVE_TEXTO_MODO,
  CLAVE_TEXTO_TAMANO,
  PALETA_TEXTO,
  PAUSA_DESPLAZAMIENTO_MS,
  TAMANOS_TEXTO,
  TAMANO_INICIAL,
  estaSincronizado,
  leerModo,
  leerTamano,
  marcasDeTiempo,
  pasoTamano,
  textosPanel,
  versiculoActual,
  type ModoTexto,
  type TextoEpisodio,
} from "@audite/domain";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useMemo, useRef, useState } from "react";
import { AccessibilityInfo, Pressable, ScrollView, Text, View, type ScrollViewInstance } from "react-native";
import type { CargaTexto } from "./texto";

const ORO = "#C9A96E";

function usePreferencias() {
  const [tamano, setTamano] = useState(TAMANO_INICIAL);
  const [modo, setModo] = useState<ModoTexto>("noche");
  useEffect(() => {
    void AsyncStorage.multiGet([CLAVE_TEXTO_TAMANO, CLAVE_TEXTO_MODO]).then((pares) => {
      const mapa = new Map(pares);
      setTamano(leerTamano(mapa.get(CLAVE_TEXTO_TAMANO)));
      setModo(leerModo(mapa.get(CLAVE_TEXTO_MODO)));
    });
  }, []);
  return {
    tamano,
    modo,
    cambiarTamano(delta: -1 | 1) {
      const siguiente = pasoTamano(tamano, delta);
      setTamano(siguiente);
      void AsyncStorage.setItem(CLAVE_TEXTO_TAMANO, String(siguiente));
    },
    alternarModo() {
      const siguiente: ModoTexto = modo === "noche" ? "dia" : "noche";
      setModo(siguiente);
      void AsyncStorage.setItem(CLAVE_TEXTO_MODO, siguiente);
    },
  };
}

function useReducirMovimiento(preferencia: boolean): boolean {
  const [sistema, setSistema] = useState(false);
  useEffect(() => {
    let vivo = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((valor) => {
      if (vivo) setSistema(valor);
    });
    const aviso = AccessibilityInfo.addEventListener("reduceMotionChanged", setSistema);
    return () => {
      vivo = false;
      aviso.remove();
    };
  }, []);
  return preferencia || sistema;
}

const boton = { minHeight: 44, minWidth: 44, borderRadius: 999, alignItems: "center" as const, justifyContent: "center" as const, paddingHorizontal: 10 };

export function PanelTextoApp({
  carga,
  uiLocale,
  tiempo,
  onSaltar,
  reducirMovimiento,
  onEntrar,
  onSuscribir,
  onReintentar,
}: {
  carga: CargaTexto;
  uiLocale: string;
  tiempo: number;
  onSaltar: (segundo: number) => void;
  reducirMovimiento: boolean;
  onEntrar: () => void;
  onSuscribir: () => void;
  onReintentar: () => void;
}) {
  const tx = textosPanel(uiLocale);
  const { tamano, modo, cambiarTamano, alternarModo } = usePreferencias();
  const paleta = PALETA_TEXTO[modo];
  if (carga.tipo === "apagado") return null;
  return (
    <View accessible={false} accessibilityLabel={tx.region} style={{ flex: 1, backgroundColor: paleta.fondo, borderColor: paleta.borde, borderTopWidth: 1 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, paddingTop: 8 }}>
        <Text accessibilityRole="header" style={{ color: paleta.tinta, fontSize: 22 }}>{tx.titulo}</Text>
        {carga.tipo === "listo" ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Pressable accessibilityRole="button" accessibilityLabel={tx.menos} accessibilityState={{ disabled: tamano === 0 }} disabled={tamano === 0} onPress={() => cambiarTamano(-1)} style={[boton, { opacity: tamano === 0 ? 0.4 : 1 }]}>
              <Text style={{ color: paleta.tinta, fontSize: 16 }}>A−</Text>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel={tx.mas} accessibilityState={{ disabled: tamano === TAMANOS_TEXTO.length - 1 }} disabled={tamano === TAMANOS_TEXTO.length - 1} onPress={() => cambiarTamano(1)} style={[boton, { opacity: tamano === TAMANOS_TEXTO.length - 1 ? 0.4 : 1 }]}>
              <Text style={{ color: paleta.tinta, fontSize: 20 }}>A+</Text>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityState={{ selected: modo === "dia" }} onPress={alternarModo} style={[boton, { borderWidth: 1, borderColor: paleta.borde }]}>
              <Text style={{ color: paleta.tinta, fontSize: 14 }}>{modo === "noche" ? tx.modoDia : tx.modoNoche}</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
      {carga.tipo === "listo" ? (
        <Lectura texto={carga.texto} tamano={tamano} modo={modo} tiempo={tiempo} onSaltar={onSaltar} reducirMovimiento={reducirMovimiento} uiLocale={uiLocale} />
      ) : (
        <View style={{ padding: 16, gap: 12 }} accessibilityLiveRegion={carga.tipo === "cargando" ? "polite" : "none"}>
          {carga.tipo === "cargando" ? <Text style={{ color: paleta.suave }}>{tx.cargando}</Text> : null}
          {carga.tipo === "sin-texto" ? <Text style={{ color: paleta.suave }}>{tx.sinTexto}</Text> : null}
          {carga.tipo === "sin-sesion" ? (
            <>
              <Text style={{ color: paleta.tinta }}>{tx.sinSesion}</Text>
              <Pressable accessibilityRole="button" onPress={onEntrar} style={[boton, { backgroundColor: ORO, alignSelf: "flex-start", paddingHorizontal: 20 }]}>
                <Text style={{ color: "#100E0C" }}>{tx.entrar}</Text>
              </Pressable>
            </>
          ) : null}
          {carga.tipo === "sin-permiso" ? (
            <>
              <Text style={{ color: paleta.tinta }}>{tx.sinPermiso}</Text>
              <Pressable accessibilityRole="button" onPress={onSuscribir} style={[boton, { backgroundColor: ORO, alignSelf: "flex-start", paddingHorizontal: 20 }]}>
                <Text style={{ color: "#100E0C" }}>{tx.prueba}</Text>
              </Pressable>
            </>
          ) : null}
          {carga.tipo === "error" ? (
            <>
              <Text style={{ color: paleta.tinta }}>{tx.error}</Text>
              <Pressable accessibilityRole="button" onPress={onReintentar} style={[boton, { borderWidth: 1, borderColor: paleta.borde, alignSelf: "flex-start", paddingHorizontal: 20 }]}>
                <Text style={{ color: paleta.tinta }}>{tx.reintentar}</Text>
              </Pressable>
            </>
          ) : null}
        </View>
      )}
    </View>
  );
}

function Lectura({
  texto,
  tamano,
  modo,
  tiempo,
  onSaltar,
  reducirMovimiento,
  uiLocale,
}: {
  texto: TextoEpisodio;
  tamano: number;
  modo: ModoTexto;
  tiempo: number;
  onSaltar: (segundo: number) => void;
  reducirMovimiento: boolean;
  uiLocale: string;
}) {
  const tx = textosPanel(uiLocale);
  const paleta = PALETA_TEXTO[modo];
  const reducir = useReducirMovimiento(reducirMovimiento);
  const sincronizado = useMemo(() => estaSincronizado(texto.versiculos), [texto]);
  const marcas = useMemo(() => (sincronizado ? marcasDeTiempo(texto.versiculos) : []), [sincronizado, texto]);
  const actual = sincronizado ? versiculoActual(marcas, tiempo) : -1;
  const lista = useRef<ScrollViewInstance>(null);
  const posiciones = useRef<Map<number, number>>(new Map());
  const [alto, setAlto] = useState(0);
  const [pausado, setPausado] = useState(false);
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tamanoLetra = TAMANOS_TEXTO[tamano] ?? TAMANOS_TEXTO[TAMANO_INICIAL];

  useEffect(() => () => {
    if (temporizador.current) clearTimeout(temporizador.current);
  }, []);

  useEffect(() => {
    if (actual < 0 || pausado) return;
    const y = posiciones.current.get(actual);
    if (y == null) return;
    lista.current?.scrollTo({ y: Math.max(0, y - alto / 3), animated: !reducir });
  }, [actual, pausado, reducir, alto, tamano]);

  function pausar() {
    if (!sincronizado) return;
    setPausado(true);
    if (temporizador.current) clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => setPausado(false), PAUSA_DESPLAZAMIENTO_MS);
  }

  function reanudar() {
    if (temporizador.current) clearTimeout(temporizador.current);
    setPausado(false);
  }

  return (
    <View style={{ flex: 1 }}>
      {texto.muestra ? (
        <Text accessibilityRole="text" style={{ marginHorizontal: 12, marginTop: 8, padding: 8, borderRadius: 12, borderWidth: 1, borderColor: paleta.numero, color: paleta.tinta, fontWeight: "600", fontSize: 14 }}>
          {tx.muestra}
        </Text>
      ) : null}
      {sincronizado ? null : <Text style={{ marginHorizontal: 12, marginTop: 8, color: paleta.suave, fontSize: 14 }}>{tx.sinSincronia}</Text>}
      <ScrollView
        ref={lista}
        accessibilityLabel={tx.region}
        accessibilityLiveRegion="none"
        onLayout={(evento) => setAlto(evento.nativeEvent.layout.height)}
        onScrollBeginDrag={pausar}
        contentContainerStyle={{ paddingHorizontal: 6, paddingVertical: 8 }}
        style={{ flex: 1 }}
      >
        {texto.versiculos.map((versiculo, indice) => {
          const esActual = indice === actual;
          const saltable = sincronizado && typeof versiculo.t === "number";
          const color = esActual || !sincronizado ? paleta.tinta : paleta.suave;
          const contenido = (
            <Text style={{ color, fontSize: tamanoLetra, lineHeight: Math.round(tamanoLetra * 1.6) }}>
              <Text style={{ color: paleta.numero, fontSize: Math.round(tamanoLetra * 0.7), fontWeight: "600" }}>{versiculo.v} </Text>
              {versiculo.texto}
            </Text>
          );
          const estilo = { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 8, minHeight: 44, backgroundColor: esActual ? paleta.actual : "transparent" };
          return (
            <View key={`${versiculo.ref}-${indice}`} onLayout={(evento) => posiciones.current.set(indice, evento.nativeEvent.layout.y)}>
              {saltable ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityHint={tx.saltar(versiculo.v)}
                  accessibilityState={{ selected: esActual }}
                  onPress={() => onSaltar(versiculo.t as number)}
                  style={estilo}
                >
                  {contenido}
                </Pressable>
              ) : (
                <View accessible accessibilityRole="text" accessibilityState={{ selected: esActual }} style={estilo}>
                  {contenido}
                </View>
              )}
            </View>
          );
        })}
        <Text style={{ color: paleta.suave, fontSize: 12, paddingHorizontal: 10, paddingTop: 12 }}>
          {texto.fuente}. {texto.credito}
        </Text>
      </ScrollView>
      {pausado && actual >= 0 ? (
        <Pressable accessibilityRole="button" onPress={reanudar} style={[boton, { backgroundColor: ORO, position: "absolute", bottom: 12, alignSelf: "center", paddingHorizontal: 16 }]}>
          <Text style={{ color: "#100E0C", fontSize: 14 }}>{tx.volver}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
