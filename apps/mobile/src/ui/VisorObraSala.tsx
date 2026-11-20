import { useCallback, useEffect, useMemo, useRef } from "react";
import { Animated, Image, PanResponder, Platform, StyleSheet, View } from "react-native";
import { BucleCuadro } from "../bucle-cuadro";
import type { BucleMovil } from "../bucles";
import { uriDeObra } from "../entorno";
import { ZOOM_DOBLE_TOQUE, limitarDesplazamiento, limitarZoom } from "../sala";
import { useMovimientoReducido } from "./tema";

type Props = {
  clave: string;
  src: string;
  alt: string;
  ancho: number;
  alto: number;
  bucle?: BucleMovil | null;
  reiniciarSeq?: number;
  onZoomCambia?: (escala: number) => void;
};

/**
 * Cuadro montado en pared de museo oscura: marco sutil, proporción original sin recorte,
 * bucle animado en contain cuando existe, pellizco para ampliar y doble toque para volver.
 */
export function VisorObraSala({ clave, src, alt, ancho, alto, bucle, reiniciarSeq = 0, onZoomCambia }: Props) {
  const reducir = useMovimientoReducido();
  const animEscala = useRef(new Animated.Value(1)).current;
  const animX = useRef(new Animated.Value(0)).current;
  const animY = useRef(new Animated.Value(0)).current;

  const estado = useRef({
    escala: 1,
    x: 0,
    y: 0,
    pinchDist: 0,
    pinchEscala: 1,
    panInicioX: 0,
    panInicioY: 0,
    pellizcando: false,
    movido: false,
    ultimoToque: 0,
    ultimoX: 0,
    ultimoY: 0,
    ultimoAlternar: 0,
  });

  const dims = useRef({ ancho, alto, reducir, onZoomCambia });
  dims.current = { ancho, alto, reducir, onZoomCambia };

  const fijarInmediato = useCallback(
    (escala: number, x: number, y: number) => {
      const z = limitarZoom(escala);
      const pos = limitarDesplazamiento(x, y, z, dims.current.ancho, dims.current.alto);
      estado.current.escala = z;
      estado.current.x = pos.x;
      estado.current.y = pos.y;
      animEscala.setValue(z);
      animX.setValue(pos.x);
      animY.setValue(pos.y);
      dims.current.onZoomCambia?.(z);
    },
    [animEscala, animX, animY],
  );

  const animarA = useCallback(
    (escala: number, x: number, y: number) => {
      const z = limitarZoom(escala);
      const pos = limitarDesplazamiento(x, y, z, dims.current.ancho, dims.current.alto);
      estado.current.escala = z;
      estado.current.x = pos.x;
      estado.current.y = pos.y;
      dims.current.onZoomCambia?.(z);
      if (dims.current.reducir) {
        animEscala.setValue(z);
        animX.setValue(pos.x);
        animY.setValue(pos.y);
        return;
      }
      Animated.parallel([
        Animated.spring(animEscala, { toValue: z, useNativeDriver: true, speed: 24, bounciness: 4 }),
        Animated.spring(animX, { toValue: pos.x, useNativeDriver: true, speed: 24, bounciness: 4 }),
        Animated.spring(animY, { toValue: pos.y, useNativeDriver: true, speed: 24, bounciness: 4 }),
      ]).start();
    },
    [animEscala, animX, animY],
  );

  useEffect(() => {
    fijarInmediato(1, 0, 0);
  }, [clave, fijarInmediato]);

  useEffect(() => {
    if (reiniciarSeq > 0) animarA(1, 0, 0);
  }, [reiniciarSeq, animarA]);

  const alternarDobleToque = useCallback(
    (locX?: number, locY?: number) => {
      const ahora = Date.now();
      if (ahora - estado.current.ultimoAlternar < 160) return;
      estado.current.ultimoAlternar = ahora;
      if (estado.current.escala > 1.05) {
        animarA(1, 0, 0);
        return;
      }
      const objetivo = ZOOM_DOBLE_TOQUE;
      const dx = typeof locX === "number" ? (dims.current.ancho / 2 - locX) * (objetivo - 1) * 0.7 : 0;
      const dy = typeof locY === "number" ? (dims.current.alto / 2 - locY) * (objetivo - 1) * 0.7 : 0;
      animarA(objetivo, dx, dy);
    },
    [animarA],
  );

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (evt) => {
          const touches = evt.nativeEvent.touches;
          if (touches.length >= 2) {
            const [a, b] = [touches[0]!, touches[1]!];
            estado.current.pinchDist = Math.hypot(a.pageX - b.pageX, a.pageY - b.pageY);
            estado.current.pinchEscala = estado.current.escala;
            estado.current.pellizcando = true;
            estado.current.movido = true;
          } else {
            estado.current.pinchDist = 0;
            estado.current.pellizcando = false;
            estado.current.movido = false;
            estado.current.panInicioX = estado.current.x;
            estado.current.panInicioY = estado.current.y;
          }
        },
        onPanResponderMove: (evt, gs) => {
          const touches = evt.nativeEvent.touches;
          if (touches.length >= 2) {
            const [a, b] = [touches[0]!, touches[1]!];
            const dist = Math.hypot(a.pageX - b.pageX, a.pageY - b.pageY);
            if (!estado.current.pinchDist) {
              estado.current.pinchDist = dist || 1;
              estado.current.pinchEscala = estado.current.escala;
              estado.current.pellizcando = true;
              estado.current.movido = true;
              return;
            }
            const escala = limitarZoom(estado.current.pinchEscala * (dist / Math.max(1, estado.current.pinchDist)));
            fijarInmediato(escala, estado.current.x, estado.current.y);
            estado.current.movido = true;
            return;
          }
          if (!estado.current.pellizcando && estado.current.escala > 1.02) {
            if (Math.hypot(gs.dx, gs.dy) > 4) estado.current.movido = true;
            fijarInmediato(estado.current.escala, estado.current.panInicioX + gs.dx, estado.current.panInicioY + gs.dy);
          } else if (Math.hypot(gs.dx, gs.dy) > 8) {
            estado.current.movido = true;
          }
        },
        onPanResponderRelease: (evt, gs) => {
          const fuePellizco = estado.current.pellizcando;
          estado.current.pinchDist = 0;
          estado.current.pellizcando = false;

          if (estado.current.escala < 1.06 && fuePellizco) {
            animarA(1, 0, 0);
            return;
          }

          if (!fuePellizco && !estado.current.movido && Math.hypot(gs.dx, gs.dy) < 10) {
            const ahora = Date.now();
            const locX = evt.nativeEvent.locationX;
            const locY = evt.nativeEvent.locationY;
            const cerca =
              Math.hypot((locX ?? 0) - estado.current.ultimoX, (locY ?? 0) - estado.current.ultimoY) < 36;
            if (ahora - estado.current.ultimoToque < 320 && cerca) {
              estado.current.ultimoToque = 0;
              alternarDobleToque(locX, locY);
            } else {
              estado.current.ultimoToque = ahora;
              estado.current.ultimoX = locX ?? 0;
              estado.current.ultimoY = locY ?? 0;
            }
          }
        },
        onPanResponderTerminate: () => {
          estado.current.pinchDist = 0;
          estado.current.pellizcando = false;
        },
      }),
    [alternarDobleToque, animarA, fijarInmediato],
  );

  const uri = src ? uriDeObra(src) : "";
  const usaBucle = Boolean(bucle && (bucle.poster || uri));
  const webEventos =
    Platform.OS === "web"
      ? ({
          onDoubleClick: () => alternarDobleToque(),
          onWheel: (e: { deltaY?: number; preventDefault?: () => void }) => {
            if (typeof e.deltaY !== "number") return;
            e.preventDefault?.();
            const factor = e.deltaY < 0 ? 1.14 : 0.88;
            const siguiente = limitarZoom(estado.current.escala * factor);
            if (siguiente <= 1.04) fijarInmediato(1, 0, 0);
            else fijarInmediato(siguiente, estado.current.x, estado.current.y);
          },
        } as Record<string, unknown>)
      : {};

  return (
    <View
      style={{
        padding: 7,
        borderRadius: 6,
        backgroundColor: "#171411",
        borderWidth: 1,
        borderColor: "rgba(201,169,110,0.28)",
        shadowColor: "#000000",
        shadowOpacity: 0.82,
        shadowRadius: 30,
        shadowOffset: { width: 0, height: 18 },
        elevation: 18,
      }}
    >
      <View
        {...pan.panHandlers}
        {...webEventos}
        accessibilityLabel={alt || undefined}
        accessible={Boolean(alt)}
        style={{
          width: ancho,
          height: alto,
          overflow: "hidden",
          borderRadius: 2,
          backgroundColor: "#0C0B09",
          borderWidth: 1,
          borderColor: "rgba(244,236,226,0.08)",
        }}
      >
        <Animated.View
          style={{
            width: ancho,
            height: alto,
            transform: [{ translateX: animX }, { translateY: animY }, { scale: animEscala }],
          }}
        >
          {usaBucle && bucle ? (
            <BucleCuadro bucle={bucle} poster={bucle.poster || uri} alt={bucle.alt || alt} />
          ) : uri ? (
            <Image source={{ uri }} resizeMode="contain" accessibilityLabel={alt || undefined} style={StyleSheet.absoluteFill} />
          ) : null}
        </Animated.View>
      </View>
    </View>
  );
}
