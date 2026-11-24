import { ETIQUETA_VER_LIBRO, altCubierta, botonesFicha, etiquetaLomo, paletaFicha, type AccionFicha, type MockLibros, type VistaLector, type VolumenEstanteria } from "@audite/domain";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Easing, Image, Modal, Platform, Pressable, ScrollView, Text, View, useWindowDimensions, type LayoutChangeEvent, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native";
import { clienteLibrosApp } from "./cliente";
import { baseContenido } from "./config";
import { precargarCubierta, precargarLibro } from "./datos";
import { urlCubierta, urlLomo } from "./estanteria-datos";
import { LETRA } from "./estilos";
import { TEXTO_PISTA, mostrarPista, pistaVista, recordarPista, vaiven } from "./pista";
import { useColoresLibros } from "./tema";
import { ui } from "../theme";

export const ALTO_LOMO = 380;
export const ANCHO_LOMO = Math.round((ALTO_LOMO * 120) / 1470);
const SEPARACION_LOMOS = 2;
const MARGEN_LATERAL = 22;
const ANCHO_CUBIERTA = 170;
const ALTO_CUBIERTA = ANCHO_CUBIERTA * 1.5;
const MS_VOLTEO = 450;
/** Estante claro, a la vista en tema día y noche. */
export const COLOR_ESTANTE = "#E8E2D8";
const COLOR_DESLIZADOR = "#B9AE9C";

const LEYENDA = "Los volúmenes 1 a 10 tienen adelanto gratis. Los volúmenes 11 a 16 están en preparación.";
const FRASE_PREPARACION = "Este volumen se está preparando. Aquí podrás leerlo cuando esté listo.";

/** Estantería ligera: lomos en horizontal y una hoja con la ficha. Sin dependencias nuevas. */
export function EstanteriaApp({ volumenes, mock }: { volumenes: VolumenEstanteria[]; mock: MockLibros | null }) {
  const colors = useColoresLibros();
  const { width: anchoPantalla } = useWindowDimensions();
  const [abierto, setAbierto] = useState<VolumenEstanteria | null>(null);
  const [x, setX] = useState(0);
  const [visible, setVisible] = useState(anchoPantalla);
  const [vista, setVista] = useState<boolean | null>(null);
  const [reducido, setReducido] = useState(false);
  const balanceo = useRef(new Animated.Value(0)).current;
  const base = baseContenido();
  const contenido = volumenes.length * (ANCHO_LOMO + SEPARACION_LOMOS) - SEPARACION_LOMOS + MARGEN_LATERAL * 2;
  const paso = ANCHO_LOMO + SEPARACION_LOMOS;
  const enfocado = Math.max(0, Math.min(volumenes.length - 1, Math.round((x + visible / 2 - MARGEN_LATERAL - ANCHO_LOMO / 2) / paso)));
  const volumenEnfocado = volumenes[enfocado] ?? volumenes[0];
  const pista = mostrarPista(vista, volumenes.length > 0);
  const lomoPista = Math.max(0, volumenes.findIndex((v) => v.disponibilidad === "lectura"));

  useEffect(() => {
    let vivo = true;
    void pistaVista(AsyncStorage).then((v) => vivo && setVista(v));
    void AccessibilityInfo.isReduceMotionEnabled().then((v) => vivo && setReducido(v));
    return () => {
      vivo = false;
    };
  }, []);
  // Las portadas de los primeros volúmenes se piden mientras se mira la estantería.
  useEffect(() => {
    volumenes.slice(0, 4).forEach((v) => precargarCubierta(v.volumen));
  }, [volumenes]);
  // Vaivén de un lomo hasta el primer toque. Con movimiento reducido el lomo queda quieto.
  useEffect(() => {
    if (!pista || reducido) return;
    const pasos = vaiven(false).slice(1).map((destino) => Animated.timing(balanceo, { toValue: destino, duration: 320, easing: Easing.inOut(Easing.quad), useNativeDriver: Platform.OS !== "web" }));
    const bucle = Animated.loop(Animated.sequence([Animated.delay(900), ...pasos, Animated.delay(2400)]));
    bucle.start();
    return () => {
      bucle.stop();
      balanceo.setValue(0);
    };
  }, [pista, reducido, balanceo]);

  const tocado = useCallback(() => {
    if (vista === false) {
      setVista(true);
      void recordarPista(AsyncStorage);
    }
  }, [vista]);
  const alDesplazar = (e: NativeSyntheticEvent<NativeScrollEvent>) => setX(e.nativeEvent.contentOffset.x);
  const alMedir = (e: LayoutChangeEvent) => setVisible(e.nativeEvent.layout.width);
  const anchoPista = Math.max(0, visible - 28 - 16);
  const anchoDeslizador = Math.max(36, anchoPista * Math.min(1, visible / contenido));
  const maxX = Math.max(1, contenido - visible);
  const posDeslizador = (anchoPista - anchoDeslizador) * Math.max(0, Math.min(1, x / maxX));
  const hayMas = contenido > visible + 1;
  const abrir = (v: VolumenEstanteria) => {
    tocado();
    setAbierto(v);
  };

  return (
    <View style={{ marginTop: 8 }} onLayout={alMedir}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} scrollEventThrottle={32} onScroll={alDesplazar} contentContainerStyle={{ paddingHorizontal: MARGEN_LATERAL, paddingTop: 22, alignItems: "flex-end", gap: SEPARACION_LOMOS }}>
        {volumenes.map((v, i) => (
          <Animated.View key={v.id} style={{ transform: [{ translateY: pista && i === lomoPista ? balanceo : 0 }] }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={etiquetaLomo(v)}
              onPressIn={() => {
                precargarLibro(v.id);
                precargarCubierta(v.volumen);
              }}
              onPress={() => abrir(v)}
              style={{ width: ANCHO_LOMO, height: ALTO_LOMO, opacity: v.disponibilidad === "borrador" ? 0.62 : 1 }}
            >
              <Image source={{ uri: urlLomo(base, v.volumen) }} accessible={false} style={{ width: "100%", height: "100%" }} resizeMode="contain" />
            </Pressable>
          </Animated.View>
        ))}
      </ScrollView>
      <View style={{ height: 14, marginHorizontal: 14, borderRadius: 7, backgroundColor: COLOR_ESTANTE, shadowColor: "#000", shadowOpacity: 0.22, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 3, justifyContent: "center", paddingHorizontal: 8 }}>
        {hayMas ? <View accessible={false} style={{ marginLeft: posDeslizador, width: anchoDeslizador, height: 4, borderRadius: 2, backgroundColor: COLOR_DESLIZADOR }} /> : null}
      </View>
      {volumenEnfocado ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={etiquetaLomo(volumenEnfocado)}
          onPress={() => abrir(volumenEnfocado)}
          style={{ marginTop: 14, marginHorizontal: 22, minHeight: 56, alignItems: "center", justifyContent: "center", gap: 2 }}
        >
          <Text style={{ color: colors.muted, fontSize: 12, letterSpacing: 1.6, textTransform: "uppercase" }}>Volumen {volumenEnfocado.volumen} · {volumenEnfocado.libro}</Text>
          <Text numberOfLines={2} style={{ color: colors.ink, fontFamily: LETRA, fontSize: 22, lineHeight: 26, textAlign: "center" }}>{volumenEnfocado.titulo}</Text>
        </Pressable>
      ) : null}
      {pista ? (
        <Text accessibilityLiveRegion="polite" style={[ui.body, { color: colors.accent, fontSize: 16, textAlign: "center", marginTop: 6, fontWeight: "600" }]}>{TEXTO_PISTA}</Text>
      ) : null}
      <Text style={[ui.body, { color: colors.muted, fontSize: 14, textAlign: "center", marginTop: 10, marginHorizontal: 22 }]}>{LEYENDA}</Text>
      {abierto ? <HojaFicha key={abierto.id} v={abierto} mock={mock} onCerrar={() => setAbierto(null)} /> : null}
    </View>
  );
}

function HojaFicha({ v, mock, onCerrar }: { v: VolumenEstanteria; mock: MockLibros | null; onCerrar: () => void }) {
  const paleta = paletaFicha(v.color);
  const router = useRouter();
  const base = baseContenido();
  const giro = useRef(new Animated.Value(0)).current;
  const [reducido, setReducido] = useState(false);
  const [vista, setVista] = useState<VistaLector | null>(null);

  useEffect(() => {
    let vivo = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((valor) => {
      if (!vivo) return;
      setReducido(valor);
      Animated.timing(giro, { toValue: 1, duration: valor ? 150 : MS_VOLTEO, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    });
    return () => {
      vivo = false;
    };
  }, [giro]);

  useEffect(() => {
    if (v.disponibilidad !== "lectura") return;
    let vivo = true;
    void clienteLibrosApp(mock).then(({ token, api }) => (token || mock ? api.acceso() : "sin-sesion")).then((siguiente) => {
      if (vivo) setVista(siguiente);
    });
    return () => {
      vivo = false;
    };
  }, [v.disponibilidad, mock]);

  const botones = botonesFicha(vista, v.disponibilidad);
  const ir = (ruta: string) => {
    onCerrar();
    router.push(ruta as never);
  };
  const destino = (accion: AccionFicha) => {
    if (accion === "leer") ir(`/libros/${v.id}/leer${mock ? `?mock=${mock}` : ""}`);
    else if (accion === "entrar") ir("/entrar");
    else ir("/suscripcion");
  };

  // Volteo del lomo a la cubierta con perspectiva. Con movimiento reducido solo cambia la opacidad.
  const lomoGira = giro.interpolate({ inputRange: [0, 0.5, 1], outputRange: ["0deg", "90deg", "90deg"] });
  const cubiertaGira = giro.interpolate({ inputRange: [0, 0.5, 1], outputRange: ["-90deg", "-90deg", "0deg"] });
  const lomoOpacidad = giro.interpolate({ inputRange: [0, 0.49, 0.5, 1], outputRange: [1, 1, 0, 0] });
  const cubiertaOpacidad = giro.interpolate({ inputRange: [0, 0.5, 0.51, 1], outputRange: [0, 0, 1, 1] });
  const plano = giro;

  return (
    <Modal visible transparent animationType="none" onRequestClose={onCerrar} accessibilityViewIsModal>
      <View style={{ flex: 1, backgroundColor: paleta.fondo }}>
        <Pressable accessibilityLabel="Cerrar la ficha del libro" accessibilityRole="button" onPress={onCerrar} style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }} />
        <ScrollView contentContainerStyle={{ alignItems: "center", paddingTop: 64, paddingBottom: 40, paddingHorizontal: 22, gap: 14 }}>
          <View style={{ width: ANCHO_CUBIERTA, height: ALTO_CUBIERTA, alignItems: "center", justifyContent: "center" }}>
            {reducido ? (
              <Animated.Image source={{ uri: urlCubierta(base, v.volumen) }} accessibilityLabel={altCubierta(v)} style={{ width: ANCHO_CUBIERTA, height: ALTO_CUBIERTA, borderWidth: 1, borderColor: "rgba(0,0,0,0.35)", shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, opacity: plano }} />
            ) : (
              <>
                <Animated.Image
                  source={{ uri: urlLomo(base, v.volumen) }}
                  accessible={false}
                  resizeMode="contain"
                  style={{ position: "absolute", width: Math.round((ALTO_CUBIERTA * 120) / 1470), height: ALTO_CUBIERTA, opacity: lomoOpacidad, transform: [{ perspective: 900 }, { rotateY: lomoGira }] }}
                />
                <Animated.Image
                  source={{ uri: urlCubierta(base, v.volumen) }}
                  accessibilityLabel={altCubierta(v)}
                  style={{ position: "absolute", width: ANCHO_CUBIERTA, height: ALTO_CUBIERTA, borderWidth: 1, borderColor: "rgba(0,0,0,0.35)", shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, opacity: cubiertaOpacidad, transform: [{ perspective: 900 }, { rotateY: cubiertaGira }] }}
                />
              </>
            )}
          </View>
          <View style={{ width: "100%", maxWidth: 440, gap: 8 }}>
            <Text style={{ color: paleta.tinta, fontSize: 12, letterSpacing: 2, fontWeight: "600" }}>{v.rotulo}</Text>
            <Text accessibilityRole="header" style={{ color: paleta.tinta, fontFamily: LETRA, fontSize: 30, lineHeight: 33 }}>{v.titulo}</Text>
            <Text style={{ color: paleta.tinta, fontSize: 16, fontWeight: "600" }}>{v.subtitulo}</Text>
            <Text style={{ color: paleta.tinta, fontSize: 16, lineHeight: 25 }}>{v.sinopsis}</Text>
            <View style={{ gap: 10, marginTop: 10 }}>
              {botones.map((boton) => (
                <Pressable
                  key={boton.accion}
                  accessibilityRole={boton.nivel === "enlace" ? "link" : "button"}
                  onPress={() => destino(boton.accion)}
                  style={[
                    { minHeight: 48, borderRadius: 999, alignItems: "center", justifyContent: "center", paddingHorizontal: 22 },
                    boton.nivel === "primario" ? { backgroundColor: paleta.tinta } : boton.nivel === "secundario" ? { borderWidth: 2, borderColor: paleta.tinta } : { minHeight: 44 },
                  ]}
                >
                  <Text style={{ color: boton.nivel === "primario" ? paleta.tintaInversa : paleta.tinta, fontWeight: boton.nivel === "enlace" ? "400" : "600", fontSize: 16, textDecorationLine: boton.nivel === "enlace" ? "underline" : "none" }}>{boton.etiqueta}</Text>
                </Pressable>
              ))}
              <Pressable accessibilityRole="link" onPress={() => ir(`/libros/${v.id}${mock ? `?mock=${mock}` : ""}`)} style={{ minHeight: 44, justifyContent: "center", alignItems: "center" }}>
                <Text style={{ color: paleta.tinta, fontSize: 16, textDecorationLine: "underline" }}>{ETIQUETA_VER_LIBRO}</Text>
              </Pressable>
              {v.disponibilidad !== "lectura" ? (
                <View style={{ borderWidth: 1, borderColor: "rgba(0,0,0,0.25)", backgroundColor: "rgba(0,0,0,0.25)", borderRadius: 16, padding: 14, gap: 6 }}>
                  <Text style={{ color: paleta.tinta, fontSize: 13, fontWeight: "600" }}>En preparación</Text>
                  <Text style={{ color: paleta.tinta, fontSize: 15 }}>{FRASE_PREPARACION}</Text>
                </View>
              ) : null}
            </View>
            {v.episodios_destacados.length > 0 ? (
              <View style={{ marginTop: 16, borderTopWidth: 1, borderTopColor: "rgba(0,0,0,0.25)", paddingTop: 12 }}>
                <Text accessibilityRole="header" style={{ color: paleta.tinta, fontSize: 13, letterSpacing: 2, fontWeight: "600" }}>EPISODIOS RELACIONADOS</Text>
                {v.episodios_destacados.map((e) => (
                  <Pressable key={e.episodio_id} accessibilityRole="link" onPress={() => ir(`/episodio/${e.episodio_id}`)} style={{ minHeight: 48, justifyContent: "center", borderBottomWidth: 1, borderBottomColor: "rgba(0,0,0,0.25)", paddingVertical: 8 }}>
                    <Text style={{ color: paleta.tinta, fontSize: 14, fontWeight: "600" }}>{e.etiqueta}</Text>
                    <Text style={{ color: paleta.tinta, fontSize: 16 }}>{e.titulo}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
            {v.credito_obra ? <Text style={{ color: paleta.tinta, fontSize: 12, marginTop: 12 }}>Portada: {v.credito_obra}</Text> : null}
          </View>
        </ScrollView>
        <Pressable accessibilityRole="button" accessibilityLabel="Cerrar la ficha del libro" onPress={onCerrar} style={{ position: "absolute", top: 48, right: 16, minHeight: 44, minWidth: 44, paddingHorizontal: 18, borderRadius: 999, borderWidth: 1, borderColor: paleta.tinta, backgroundColor: "rgba(0,0,0,0.28)", alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: paleta.tinta, fontSize: 16 }}>Cerrar</Text>
        </Pressable>
      </View>
    </Modal>
  );
}
