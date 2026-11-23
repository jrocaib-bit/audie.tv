import { useVideoPlayer, VideoView } from "expo-video";
import { useCallback, useEffect, useRef } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import type { ViajeSede } from "../sala-assets";
import type { LugarObra } from "../sala-lugares";
import { ESPERA_LISTO_VUELO_MS, type MensajeVuelo, type PlanVuelo } from "../sala-vuelo";
import { fonts } from "../theme";
import { VueloGoogle3D } from "./VueloGoogle3D";

/** Línea de tiempo (ms) del viaje: espacio -> Tierra -> ciudad -> edificio -> sala. */
export type TiemposViaje = {
  video: number;
  finalIn: number;
  edificioIn: number;
  edificioOut: number;
  salaIn: number;
  total: number;
};

export function tiemposViaje(conEdificio: boolean): TiemposViaje {
  if (!conEdificio) {
    return { video: 1800, finalIn: 1650, edificioIn: 1800, edificioOut: 1800, salaIn: 1850, total: 3550 };
  }
  return { video: 2200, finalIn: 2050, edificioIn: 2200, edificioOut: 3450, salaIn: 3250, total: 5000 };
}

type Props = {
  viaje: ViajeSede;
  lugar: LugarObra;
  lang: "es" | "en";
  saltarLabel: string;
  topInset: number;
  reloj: SharedValue<number>;
  tiempos: TiemposViaje;
  onTerminar: () => void;
  /** Vuelo en vivo (Google 3D Tiles). Si es null, o falla, se usa la entrada v2 (vídeo + fotos). */
  vuelo?: { plan: PlanVuelo; clave: string } | null;
  onVueloFallido?: () => void;
};

/**
 * Entrada fotorrealista (≈5 s, saltable con un toque; se omite con «reducir movimiento»):
 * vídeo pre-renderizado (estrellas + Tierra NASA + satélite Sentinel-2) -> fachada real -> sala.
 * La entrada en la sala (cámara que avanza hacia la obra) la dibuja la pantalla con el mismo reloj.
 */
export function EntradaSalaViaje({ viaje, lugar, lang, saltarLabel, topInset, reloj, tiempos, onTerminar, vuelo, onVueloFallido }: Props) {
  const vivo = Boolean(vuelo);
  const arrancadoVivo = useRef(false);
  const arrancado = useRef(false);
  const terminado = useRef(false);
  const T = tiempos.total;

  const terminar = useCallback(() => {
    if (terminado.current) return;
    terminado.current = true;
    onTerminar();
  }, [onTerminar]);

  const player = useVideoPlayer(viaje.video, (p) => {
    p.muted = true;
    p.loop = false;
    p.audioMixingMode = "mixWithOthers";
    p.showNowPlayingNotification = false;
  });

  const arrancar = useCallback(() => {
    if (arrancado.current) return;
    arrancado.current = true;
    try {
      player.currentTime = 0;
      player.play();
    } catch {
      // Si el vídeo no puede reproducirse, el póster y el fotograma final mantienen la secuencia.
    }
    reloj.value = 0;
    reloj.value = withTiming(T, { duration: T, easing: Easing.linear }, (fin) => {
      if (fin) runOnJS(terminar)();
    });
  }, [T, player, reloj, terminar]);

  // Vuelo en vivo: el reloj arranca cuando la WebView avisa «listo». Si tarda demasiado o falla, se cae al viaje v2.
  const arrancarVivo = useCallback(() => {
    if (arrancadoVivo.current) return;
    arrancadoVivo.current = true;
    reloj.value = 0;
    reloj.value = withTiming(T, { duration: T, easing: Easing.linear }, (fin) => {
      if (fin) runOnJS(terminar)();
    });
  }, [T, reloj, terminar]);

  const alMensajeVuelo = useCallback(
    (m: MensajeVuelo) => {
      if (m.tipo === "listo") arrancarVivo();
      else if (m.tipo === "error" && !arrancadoVivo.current) onVueloFallido?.();
    },
    [arrancarVivo, onVueloFallido],
  );

  useEffect(() => {
    if (!vivo) return;
    reloj.value = 0;
    const espera = setTimeout(() => {
      if (!arrancadoVivo.current) onVueloFallido?.();
    }, ESPERA_LISTO_VUELO_MS);
    return () => {
      clearTimeout(espera);
      cancelAnimation(reloj);
    };
  }, [onVueloFallido, reloj, vivo]);

  useEffect(() => {
    if (vivo) return;
    reloj.value = 0;
    const sub = player.addListener("statusChange", ({ status }) => {
      if (status === "readyToPlay") arrancar();
      if (status === "error") arrancar();
    });
    if (player.status === "readyToPlay") arrancar();
    const respaldo = setTimeout(arrancar, 1200);
    return () => {
      sub.remove();
      clearTimeout(respaldo);
      cancelAnimation(reloj);
    };
  }, [arrancar, player, reloj, vivo]);

  const saltar = useCallback(() => {
    arrancado.current = true;
    arrancadoVivo.current = true;
    cancelAnimation(reloj);
    const desde = Math.max(reloj.value, tiempos.salaIn - 200);
    reloj.value = desde;
    reloj.value = withTiming(T, { duration: 520, easing: Easing.out(Easing.cubic) }, (fin) => {
      if (fin) runOnJS(terminar)();
    });
  }, [T, reloj, terminar, tiempos.salaIn]);

  const conEdificio = Boolean(viaje.edificio);

  const estiloFondo = useAnimatedStyle(() => ({
    opacity: interpolate(reloj.value, [tiempos.salaIn, tiempos.salaIn + 420], [1, 0], Extrapolation.CLAMP),
  }));

  // El póster (primer fotograma) solo cubre la carga del vídeo; desaparece antes de revelar la sala.
  const estiloPoster = useAnimatedStyle(() => ({
    opacity: interpolate(reloj.value, [tiempos.finalIn, tiempos.finalIn + 60], [1, 0], Extrapolation.CLAMP),
  }));

  const estiloVideo = useAnimatedStyle(() => ({
    opacity: interpolate(reloj.value, [tiempos.finalIn, tiempos.finalIn + 200], [1, 0], Extrapolation.CLAMP),
  }));

  const estiloFinal = useAnimatedStyle(() => {
    const salida = conEdificio ? tiempos.edificioIn + 420 : tiempos.salaIn + 300;
    return {
      opacity: interpolate(reloj.value, [tiempos.finalIn - 10, tiempos.finalIn, salida - 220, salida], [0, 1, 1, 0], Extrapolation.CLAMP),
      transform: [{ scale: interpolate(reloj.value, [tiempos.finalIn, salida], [1, 1.3], Extrapolation.CLAMP) }],
    };
  });

  const estiloEdificio = useAnimatedStyle(() => ({
    opacity: interpolate(
      reloj.value,
      [tiempos.edificioIn, tiempos.edificioIn + 380, tiempos.edificioOut - 250, tiempos.edificioOut],
      [0, 1, 1, 0],
      Extrapolation.CLAMP,
    ),
    transform: [{ scale: interpolate(reloj.value, [tiempos.edificioIn, tiempos.edificioOut], [1.0, 1.16], Extrapolation.CLAMP) }],
  }));

  const estiloRotulo = useAnimatedStyle(() => ({
    opacity: interpolate(reloj.value, [1100, 1500, tiempos.salaIn - 150, tiempos.salaIn + 100], [0, 1, 1, 0], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(reloj.value, [1100, 1500], [8, 0], Extrapolation.CLAMP) }],
  }));

  const estiloPin = useAnimatedStyle(() => ({
    opacity: interpolate(reloj.value, [1500, 1750, tiempos.finalIn + 300, tiempos.finalIn + 500], [0, 1, 1, 0], Extrapolation.CLAMP),
    transform: [{ scale: interpolate(reloj.value, [1500, tiempos.finalIn + 500], [1.6, 0.9], Extrapolation.CLAMP) }],
  }));

  const estiloVivo = useAnimatedStyle(() => ({
    opacity: interpolate(reloj.value, [0, 250], [0, 1], Extrapolation.CLAMP),
  }));

  const ciudad = lugar.ciudad[lang] || lugar.ciudad.es;
  const edificio = lugar.edificio[lang] || lugar.edificio.es;

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { zIndex: 40, backgroundColor: "#020205" }, estiloFondo]}>
      <Pressable onPress={saltar} accessibilityRole="button" accessibilityLabel={saltarLabel} style={StyleSheet.absoluteFill}>
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <Animated.View style={[StyleSheet.absoluteFill, estiloPoster]}>
            <Image source={viaje.inicio} resizeMode="cover" style={StyleSheet.absoluteFill} accessibilityIgnoresInvertColors />
          </Animated.View>
          {vivo && vuelo ? (
            <Animated.View style={[StyleSheet.absoluteFill, estiloVivo]}>
              <VueloGoogle3D plan={vuelo.plan} clave={vuelo.clave} onMensaje={alMensajeVuelo} />
            </Animated.View>
          ) : (
            <>
              <Animated.View style={[StyleSheet.absoluteFill, estiloVideo]}>
                <VideoView player={player} nativeControls={false} contentFit="cover" allowsPictureInPicture={false} style={StyleSheet.absoluteFill} />
              </Animated.View>
              <Animated.View style={[StyleSheet.absoluteFill, estiloFinal]}>
                <Image source={viaje.final} resizeMode="cover" style={StyleSheet.absoluteFill} />
              </Animated.View>
              {lugar.lat != null ? (
                <Animated.View style={[styles.pin, estiloPin]}>
                  <View style={styles.pinAro} />
                  <View style={styles.pinPunto} />
                </Animated.View>
              ) : null}
              {viaje.edificio ? (
                <Animated.View style={[StyleSheet.absoluteFill, estiloEdificio]}>
                  <Image source={viaje.edificio} resizeMode="cover" style={StyleSheet.absoluteFill} accessibilityLabel={edificio} />
                </Animated.View>
              ) : null}
            </>
          )}
          {vivo ? null : <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.06)" }]} />}
        </View>

        {edificio || ciudad ? (
          <Animated.View pointerEvents="none" style={[styles.rotulo, estiloRotulo]}>
            {edificio ? (
              <Text numberOfLines={2} style={styles.rotuloEdificio}>
                {edificio}
              </Text>
            ) : null}
            <Text style={styles.rotuloCoords}>{[ciudad, lugar.coordenadasTexto].filter(Boolean).join(" · ")}</Text>
          </Animated.View>
        ) : null}

        <View style={{ position: "absolute", right: 18, top: topInset + 58 }}>
          <View style={styles.saltar}>
            <Text style={{ color: "#F4ECE2", fontFamily: fonts.medium, fontSize: 12 }}>{saltarLabel}</Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  pin: {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: 44,
    height: 44,
    marginLeft: -22,
    marginTop: -22,
    alignItems: "center",
    justifyContent: "center",
  },
  pinAro: {
    position: "absolute",
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: "rgba(240,211,153,0.9)",
    backgroundColor: "rgba(240,211,153,0.12)",
  },
  pinPunto: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#F0D399" },
  rotulo: {
    position: "absolute",
    left: 24,
    right: 24,
    bottom: 104,
    alignItems: "center",
    gap: 4,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: "rgba(6,6,10,0.46)",
  },
  rotuloEdificio: { color: "#F4ECE2", fontFamily: fonts.serif, fontSize: 21, lineHeight: 26, textAlign: "center" },
  rotuloCoords: { color: "#E0C48A", fontFamily: fonts.sans, fontSize: 13, letterSpacing: 0.6, textAlign: "center" },
  saltar: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(16,14,12,0.7)",
    borderWidth: 1,
    borderColor: "rgba(201,169,110,0.45)",
  },
});
