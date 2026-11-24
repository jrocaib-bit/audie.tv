import { ETIQUETA_VER_LIBRO, altCubierta, botonesFicha, etiquetaLomo, type AccionFicha, type MockLibros, type VistaLector, type VolumenEstanteria } from "@audite/domain";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Easing, Image, Modal, Pressable, ScrollView, Text, View } from "react-native";
import { clienteLibrosApp } from "./cliente";
import { baseContenido } from "./config";
import { urlCubierta, urlLomo } from "./estanteria-datos";
import { LETRA } from "./estilos";
import { useColoresLibros } from "./tema";
import { ui } from "../theme";

const ALTO_LOMO = 300;
const ANCHO_LOMO = Math.max(24, Math.round((ALTO_LOMO * 120) / 1470));
const ANCHO_CUBIERTA = 170;
const ALTO_CUBIERTA = ANCHO_CUBIERTA * 1.5;
const MS_VOLTEO = 450;

const LEYENDA = "Los volúmenes 1 a 10 tienen adelanto gratis. Los volúmenes 11 a 16 están en preparación.";
const FRASE_PREPARACION = "Este volumen se está preparando. Aquí podrás leerlo cuando esté listo.";

/** Estantería ligera: lomos en horizontal y una hoja con la ficha. Sin dependencias nuevas. */
export function EstanteriaApp({ volumenes, mock }: { volumenes: VolumenEstanteria[]; mock: MockLibros | null }) {
  const colors = useColoresLibros();
  const [abierto, setAbierto] = useState<VolumenEstanteria | null>(null);
  const base = baseContenido();
  return (
    <View style={{ marginTop: 8 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 14, alignItems: "flex-end", gap: 2 }}>
        {volumenes.map((v) => (
          <Pressable
            key={v.id}
            accessibilityRole="button"
            accessibilityLabel={etiquetaLomo(v)}
            onPress={() => setAbierto(v)}
            style={{ width: ANCHO_LOMO, height: ALTO_LOMO, minWidth: 24, opacity: v.disponibilidad === "borrador" ? 0.6 : 1 }}
          >
            <Image source={{ uri: urlLomo(base, v.volumen) }} accessible={false} style={{ width: "100%", height: "100%" }} resizeMode="contain" />
          </Pressable>
        ))}
      </ScrollView>
      <View style={{ height: 10, marginHorizontal: 14, backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.line }} />
      <Text style={[ui.body, { color: colors.muted, fontSize: 14, textAlign: "center", marginTop: 10, marginHorizontal: 22 }]}>{LEYENDA}</Text>
      {abierto ? <HojaFicha key={abierto.id} v={abierto} mock={mock} onCerrar={() => setAbierto(null)} /> : null}
    </View>
  );
}

function HojaFicha({ v, mock, onCerrar }: { v: VolumenEstanteria; mock: MockLibros | null; onCerrar: () => void }) {
  const colors = useColoresLibros();
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
      <View style={{ flex: 1, backgroundColor: "rgba(16,14,12,0.82)" }}>
        <Pressable accessibilityLabel="Cerrar la ficha del libro" accessibilityRole="button" onPress={onCerrar} style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }} />
        <ScrollView contentContainerStyle={{ alignItems: "center", paddingTop: 64, paddingBottom: 40, paddingHorizontal: 22, gap: 14 }}>
          <View style={{ width: ANCHO_CUBIERTA, height: ALTO_CUBIERTA, alignItems: "center", justifyContent: "center" }}>
            {reducido ? (
              <Animated.Image source={{ uri: urlCubierta(base, v.volumen) }} accessibilityLabel={altCubierta(v)} style={{ width: ANCHO_CUBIERTA, height: ALTO_CUBIERTA, opacity: plano }} />
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
                  style={{ position: "absolute", width: ANCHO_CUBIERTA, height: ALTO_CUBIERTA, opacity: cubiertaOpacidad, transform: [{ perspective: 900 }, { rotateY: cubiertaGira }] }}
                />
              </>
            )}
          </View>
          <View style={{ width: "100%", maxWidth: 440, gap: 8 }}>
            <Text style={{ color: colors.accent, fontSize: 12, letterSpacing: 2 }}>{v.rotulo}</Text>
            <Text accessibilityRole="header" style={{ color: "#F4ECE2", fontFamily: LETRA, fontSize: 30, lineHeight: 33 }}>{v.titulo}</Text>
            <Text style={{ color: "#E7D7C3", fontSize: 16 }}>{v.subtitulo}</Text>
            <Text style={{ color: "#E7D7C3", fontSize: 16, lineHeight: 24 }}>{v.sinopsis}</Text>
            <View style={{ gap: 10, marginTop: 10 }}>
              {botones.map((boton) => (
                <Pressable
                  key={boton.accion}
                  accessibilityRole={boton.nivel === "enlace" ? "link" : "button"}
                  onPress={() => destino(boton.accion)}
                  style={[
                    { minHeight: 48, borderRadius: 999, alignItems: "center", justifyContent: "center", paddingHorizontal: 22 },
                    boton.nivel === "primario" ? { backgroundColor: "#C9A96E" } : boton.nivel === "secundario" ? { borderWidth: 1, borderColor: "#C9A96E" } : { minHeight: 44 },
                  ]}
                >
                  <Text style={{ color: boton.nivel === "primario" ? "#100E0C" : boton.nivel === "secundario" ? "#C9A96E" : "#E7D7C3", fontSize: 16, textDecorationLine: boton.nivel === "enlace" ? "underline" : "none" }}>{boton.etiqueta}</Text>
                </Pressable>
              ))}
              <Pressable accessibilityRole="link" onPress={() => ir(`/libros/${v.id}${mock ? `?mock=${mock}` : ""}`)} style={{ minHeight: 44, justifyContent: "center", alignItems: "center" }}>
                <Text style={{ color: "#B7AB9C", fontSize: 16, textDecorationLine: "underline" }}>{ETIQUETA_VER_LIBRO}</Text>
              </Pressable>
              {v.disponibilidad !== "lectura" ? (
                <View style={{ borderWidth: 1, borderColor: "#2E2924", backgroundColor: "#1B1815", borderRadius: 16, padding: 14, gap: 6 }}>
                  <Text style={{ color: "#C9A96E", fontSize: 13 }}>En preparación</Text>
                  <Text style={{ color: "#E7D7C3", fontSize: 15 }}>{FRASE_PREPARACION}</Text>
                </View>
              ) : null}
            </View>
            {v.episodios_destacados.length > 0 ? (
              <View style={{ marginTop: 16, borderTopWidth: 1, borderTopColor: "#2E2924", paddingTop: 12 }}>
                <Text accessibilityRole="header" style={{ color: "#C9A96E", fontSize: 13, letterSpacing: 2 }}>EPISODIOS RELACIONADOS</Text>
                {v.episodios_destacados.map((e) => (
                  <Pressable key={e.episodio_id} accessibilityRole="link" onPress={() => ir(`/episodio/${e.episodio_id}`)} style={{ minHeight: 48, justifyContent: "center", borderBottomWidth: 1, borderBottomColor: "#2E2924", paddingVertical: 8 }}>
                    <Text style={{ color: "#C9A96E", fontSize: 14 }}>{e.etiqueta}</Text>
                    <Text style={{ color: "#F4ECE2", fontSize: 16 }}>{e.titulo}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
            {v.credito_obra ? <Text style={{ color: "#A69A8B", fontSize: 12, marginTop: 12 }}>Portada: {v.credito_obra}</Text> : null}
          </View>
        </ScrollView>
        <Pressable accessibilityRole="button" accessibilityLabel="Cerrar la ficha del libro" onPress={onCerrar} style={{ position: "absolute", top: 48, right: 16, minHeight: 44, minWidth: 44, paddingHorizontal: 18, borderRadius: 999, borderWidth: 1, borderColor: "#2E2924", backgroundColor: "#1B1815", alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: "#F4ECE2", fontSize: 16 }}>Cerrar</Text>
        </Pressable>
      </View>
    </Modal>
  );
}
