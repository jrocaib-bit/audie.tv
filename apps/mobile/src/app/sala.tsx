import { frameAt } from "@audite/domain";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View, useWindowDimensions, type LayoutChangeEvent } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BucleCuadro } from "../bucle-cuadro";
import { bucleDe, medidasHueco } from "../bucles";
import { uriDeObra } from "../entorno";
import { infoEpisodio } from "../hoy";
import { fichaMuseoObra, seleccionarObraSala, tamanoObraSala } from "../sala";
import { inferirMedio, resolverLugarObra } from "../sala-lugares";
import { camaraDeParadas, paradasDeEpisodio } from "../sala-recorrido";
import { tx } from "../textos";
import { fonts } from "../theme";
import { ArquitecturaSala } from "../ui/ArquitecturaSala";
import { BotonRedondo } from "../ui/Basicos";
import { EntradaSalaCosmos } from "../ui/EntradaSalaCosmos";
import { Icono } from "../ui/Icono";
import { Pulsable } from "../ui/Pulsable";
import { haptico, useMovimientoReducido, useTema } from "../ui/tema";
import { useContextoCatalogo } from "../ui/useHoy";
import { useReproducir } from "../ui/useReproducir";

export default function LaSala() {
  const { c, lang, library } = useTema();
  const t = tx(lang);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const ventana = useWindowDimensions();
  const reducir = useMovimientoReducido();
  const base = useContextoCatalogo();
  const reproducir = useReproducir();

  const [escenaTam, setEscenaTam] = useState({ width: ventana.width, height: Math.max(420, ventana.height - 150) });
  const stageW = escenaTam.width;
  const stageH = escenaTam.height;

  const seleccion = useMemo(
    () =>
      seleccionarObraSala({
        currentEpisodeId: library.currentEpisode?.id ?? null,
        jugando: library.playing,
        cargadoId: library.cargadoId,
        tieneActualGuardado: library.tieneActualGuardado,
        episodes: library.progress.episodes,
        validos: base.grabados,
      }),
    [base.grabados, library.cargadoId, library.currentEpisode?.id, library.playing, library.progress.episodes, library.tieneActualGuardado],
  );

  const episodioId = seleccion.episodioId;
  const info = useMemo(() => infoEpisodio(episodioId, base), [base, episodioId]);
  const episodioCatalogo = useMemo(
    () => library.catalog.episodes.find((item) => item.id === episodioId) ?? null,
    [episodioId, library.catalog.episodes],
  );

  const artworkCue = useMemo(() => {
    if (library.currentEpisode?.id !== episodioId || library.catalog.cues.length === 0) return null;
    const frame = frameAt(library.catalog.cues, library.catalog.captions, library.globalTime, true);
    return library.catalog.artworks.find((item) => item.id === frame.artworkId) ?? null;
  }, [episodioId, library.catalog.artworks, library.catalog.captions, library.catalog.cues, library.currentEpisode?.id, library.globalTime]);

  const ficha = useMemo(() => fichaMuseoObra(episodioId, lang, artworkCue), [artworkCue, episodioId, lang]);
  const bucle = useMemo(() => bucleDe(episodioId), [episodioId]);
  const src = ficha.src || info.src;
  const uri = src ? uriDeObra(src) : "";

  const medio = useMemo(() => inferirMedio(episodioId, ficha.ubicacion), [episodioId, ficha.ubicacion]);
  const lugar = useMemo(() => resolverLugarObra(ficha.ubicacion, episodioId, medio), [episodioId, ficha.ubicacion, medio]);

  const { paradas } = useMemo(
    () =>
      paradasDeEpisodio(episodioId, lang, {
        tituloObra: ficha.titulo,
        tituloEpisodio: info.titulo,
        resumen: episodioCatalogo?.summary?.[lang] || episodioCatalogo?.summary?.es || "",
      }),
    [episodioCatalogo?.summary, episodioId, ficha.titulo, info.titulo, lang],
  );

  // Tamaño de la obra entera al empezar/terminar: siempre contenida y nunca recortada.
  const maxAncho = Math.max(180, stageW - 38);
  const maxAlto = Math.max(170, Math.round(stageH * 0.54));
  let medida = tamanoObraSala(ficha.ratio, maxAncho, maxAlto);
  if (bucle && bucle.aspect) {
    const caja = medidasHueco(bucle.aspect, maxAncho + 44, maxAlto / 0.7);
    const ancho = Math.min(caja.width, maxAncho);
    const alto = ancho === caja.width ? caja.height : caja.height * (ancho / caja.width);
    medida = { width: Math.round(ancho), height: Math.round(alto) };
  }

  const centroObraY = Math.round(stageH * 0.38);
  const marcoLeft = Math.round((stageW - medida.width) / 2);
  const marcoTop = Math.round(centroObraY - medida.height / 2);
  const pasoAlto = Math.max(360, stageH);

  const keyframes = useMemo(
    () => camaraDeParadas(paradas, medida.width, medida.height, stageW, stageH),
    [medida.height, medida.width, paradas, stageH, stageW],
  );

  const rangos = useMemo(() => {
    const inputRange = paradas.map((_, i) => i * pasoAlto);
    return {
      inputRange,
      scales: keyframes.map((k) => (reducir ? 1 : k.scale)),
      txs: keyframes.map((k) => (reducir ? 0 : k.tx)),
      tys: keyframes.map((k) => (reducir ? 0 : k.ty)),
      salaOps: keyframes.map((k) => (reducir ? 1 : k.salaOpacity)),
    };
  }, [keyframes, paradas, pasoAlto, reducir]);

  const scrollRef = useRef<Animated.ScrollView | null>(null);
  const scrollY = useSharedValue(0);
  const ultimoPaso = useSharedValue(0);
  const [pasoActivo, setPasoActivo] = useState(0);
  const [mostrandoEntrada, setMostrandoEntrada] = useState(!reducir);
  const [entradaSeq, setEntradaSeq] = useState(0);

  // Al cambiar de episodio se reinicia el recorrido y vuelve a lanzarse la entrada (salvo reducir movimiento).
  useEffect(() => {
    setPasoActivo(0);
    scrollY.value = 0;
    ultimoPaso.value = 0;
    scrollRef.current?.scrollTo({ y: 0, animated: false });
    setMostrandoEntrada(!reducir);
  }, [episodioId, reducir, scrollY, ultimoPaso]);

  const alCambiarPaso = useCallback((nuevo: number) => {
    setPasoActivo(nuevo);
    haptico();
  }, []);

  const alHacerScroll = useAnimatedScrollHandler(
    {
      onScroll: (event) => {
        const y = Math.max(0, event.contentOffset.y);
        scrollY.value = y;
        const idx = Math.min(paradas.length - 1, Math.max(0, Math.round(y / pasoAlto)));
        if (idx !== ultimoPaso.value) {
          ultimoPaso.value = idx;
          runOnJS(alCambiarPaso)(idx);
        }
      },
    },
    [alCambiarPaso, paradas.length, pasoAlto],
  );

  const estiloCamara = useAnimatedStyle(() => {
    if (rangos.inputRange.length < 2) return {};
    const scale = interpolate(scrollY.value, rangos.inputRange, rangos.scales, Extrapolation.CLAMP);
    const txVal = interpolate(scrollY.value, rangos.inputRange, rangos.txs, Extrapolation.CLAMP);
    const tyVal = interpolate(scrollY.value, rangos.inputRange, rangos.tys, Extrapolation.CLAMP);
    return {
      transform: [{ translateX: txVal }, { translateY: tyVal }, { scale }],
    };
  }, [rangos]);

  const estiloArquitectura = useAnimatedStyle(() => {
    if (rangos.inputRange.length < 2) return { opacity: 1 };
    return {
      opacity: interpolate(scrollY.value, rangos.inputRange, rangos.salaOps, Extrapolation.CLAMP),
    };
  }, [rangos]);

  const irAPaso = useCallback(
    (indice: number) => {
      const clamped = Math.min(paradas.length - 1, Math.max(0, indice));
      scrollRef.current?.scrollTo({ y: clamped * pasoAlto, animated: !reducir });
    },
    [paradas.length, pasoAlto, reducir],
  );

  const onLayoutStage = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 0 && height > 0 && (Math.abs(width - stageW) > 1 || Math.abs(height - stageH) > 1)) {
      setEscenaTam({ width, height });
    }
  };

  const detalles = useMemo(() => paradas.filter((p) => p.tipo === "detalle"), [paradas]);
  const fraccionTour = paradas.length > 1 ? pasoActivo / (paradas.length - 1) : 1;
  const subtituloEp = [info.libro, info.capitulos].filter(Boolean).join(" · ");

  return (
    <View onLayout={onLayoutStage} style={{ flex: 1, backgroundColor: c.gallery, overflow: "hidden" }}>
      {/* Fondo arquitectónico de la sala real donde está la obra */}
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, estiloArquitectura]}>
        <ArquitecturaSala sala={lugar.sala} width={stageW} height={stageH} />
      </Animated.View>

      {/* Luz cálida de foco o contraluz de vitral */}
      <LinearGradient
        colors={
          medio === "vitral"
            ? ["rgba(240,211,153,0.16)", "rgba(201,169,110,0.06)", "rgba(11,12,16,0.28)"]
            : ["rgba(224,196,138,0.14)", "rgba(201,169,110,0.04)", "rgba(12,11,9,0.22)"]
        }
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* Obra fija al fondo con cámara Reanimated ligada al scroll */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Animated.View
          style={[
            {
              position: "absolute",
              left: marcoLeft - 6,
              top: marcoTop - 6,
              width: medida.width + 12,
              height: medida.height + 12,
              padding: 6,
              borderRadius: medio === "vitral" ? 12 : 4,
              backgroundColor: medio === "vitral" ? "#111014" : "#15120F",
              borderWidth: 1,
              borderColor: medio === "vitral" ? "rgba(224,196,138,0.36)" : "rgba(201,169,110,0.28)",
              shadowColor: medio === "vitral" ? "#E0C48A" : "#000000",
              shadowOpacity: medio === "vitral" ? 0.34 : 0.85,
              shadowRadius: medio === "vitral" ? 28 : 30,
              shadowOffset: { width: 0, height: medio === "vitral" ? 0 : 16 },
              elevation: 18,
            },
            estiloCamara,
          ]}
        >
          <View
            style={{
              width: medida.width,
              height: medida.height,
              overflow: "hidden",
              borderRadius: 2,
              backgroundColor: "#0C0B09",
            }}
          >
            {bucle && (bucle.poster || uri) ? (
              <BucleCuadro bucle={bucle} poster={bucle.poster || uri} alt={bucle.alt || ficha.alt || info.titulo} />
            ) : uri ? (
              <Image
                source={{ uri }}
                resizeMode="contain"
                accessibilityLabel={ficha.alt || info.titulo}
                style={StyleSheet.absoluteFill}
              />
            ) : null}
          </View>
        </Animated.View>
      </View>

      {/* Scroll narrativo hacia abajo */}
      <Animated.ScrollView
        ref={scrollRef}
        onScroll={alHacerScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        snapToInterval={pasoAlto}
        snapToAlignment="start"
        decelerationRate="fast"
        style={{ flex: 1 }}
      >
        {paradas.map((parada, idx) => {
          const esApertura = parada.tipo === "apertura";
          const esCierre = parada.tipo === "cierre";
          const indiceDetalle = parada.tipo === "detalle" ? idx : null;
          return (
            <View
              key={`${episodioId}-${idx}`}
              style={{
                height: pasoAlto,
                justifyContent: "flex-end",
                paddingTop: insets.top + 64,
                paddingHorizontal: 18,
                paddingBottom: 18,
              }}
            >
              <View
                style={{
                  borderRadius: 20,
                  backgroundColor: "rgba(16,14,12,0.88)",
                  borderWidth: 1,
                  borderColor: "rgba(46,41,36,0.95)",
                  borderLeftWidth: 2,
                  borderLeftColor: c.brand,
                  paddingHorizontal: 18,
                  paddingVertical: 15,
                  gap: 6,
                }}
              >
                {esApertura && subtituloEp ? (
                  <Text style={{ color: c.brand, fontFamily: fonts.medium, fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase" }}>
                    {subtituloEp}
                  </Text>
                ) : indiceDetalle != null ? (
                  <Text style={{ color: c.brand, fontFamily: fonts.medium, fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase" }}>
                    {t.pasoDe.replace("{n}", String(indiceDetalle)).replace("{m}", String(detalles.length))}
                  </Text>
                ) : null}

                {parada.titulo ? (
                  <Text accessibilityRole="header" style={{ color: c.ink, fontFamily: fonts.serif, fontSize: 22, lineHeight: 26 }}>
                    {parada.titulo}
                  </Text>
                ) : null}

                {parada.texto ? (
                  <Text style={{ color: "rgba(244,236,226,0.9)", fontFamily: fonts.sans, fontSize: 15, lineHeight: 22 }}>
                    {parada.texto}
                  </Text>
                ) : null}

                {esApertura ? (
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 4, gap: 10 }}>
                    {seleccion.sinEpisodio ? (
                      <Pulsable
                        onPress={() => reproducir(episodioId, { abrir: false })}
                        label={`${t.escuchar} ${info.titulo}`}
                        haptica
                        escala={0.94}
                        style={{
                          minHeight: 38,
                          paddingHorizontal: 16,
                          borderRadius: 999,
                          backgroundColor: c.accent,
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <Icono nombre="play" size={15} color={c.accentInk} />
                        <Text style={{ color: c.accentInk, fontFamily: fonts.medium, fontSize: 14, fontWeight: "600" }}>{t.escuchar}</Text>
                      </Pulsable>
                    ) : null}
                    <Pulsable
                      onPress={() => irAPaso(1)}
                      label={t.deslizaRecorrido}
                      haptica
                      escala={0.96}
                      style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 4 }}
                    >
                      <Text style={{ color: c.accent, fontFamily: fonts.medium, fontSize: 13 }}>{t.deslizaRecorrido}</Text>
                      <Icono nombre="abajo" size={16} color={c.accent} />
                    </Pulsable>
                  </View>
                ) : null}

                {esCierre && ficha.ubicacion ? (
                  <Text style={{ color: c.brand, fontFamily: fonts.sans, fontSize: 12, lineHeight: 17, paddingTop: 4 }}>
                    {t.estasEn} {ficha.ubicacion}
                  </Text>
                ) : null}
              </View>
            </View>
          );
        })}
      </Animated.ScrollView>

      {/* Puntos tocables sobre los detalles reales cuando se contempla la obra entera */}
      {detalles.length > 0 && (pasoActivo === 0 || pasoActivo === paradas.length - 1) ? (
        <View
          pointerEvents="box-none"
          style={{
            position: "absolute",
            left: marcoLeft,
            top: marcoTop,
            width: medida.width,
            height: medida.height,
            zIndex: 12,
          }}
        >
          {detalles.map((p) => {
            const left = Math.round((p.x ?? 0.5) * medida.width - 15);
            const top = Math.round((p.y ?? 0.5) * medida.height - 15);
            return (
              <Pressable
                key={`punto-${p.indice}`}
                onPress={() => {
                  haptico();
                  irAPaso(p.indice);
                }}
                accessibilityRole="button"
                accessibilityLabel={p.titulo}
                hitSlop={8}
                style={{
                  position: "absolute",
                  left,
                  top,
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  backgroundColor: "rgba(16,14,12,0.52)",
                  borderWidth: 1.5,
                  borderColor: "rgba(224,196,138,0.88)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <View style={{ width: 9, height: 9, borderRadius: 4.5, backgroundColor: "#E0C48A" }} />
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {/* Degradado superior sutil para que el texto al deslizar no choque con la cabecera */}
      <LinearGradient
        pointerEvents="none"
        colors={["rgba(12,11,9,0.72)", "rgba(12,11,9,0)"]}
        style={{ position: "absolute", top: 0, left: 0, right: 0, height: insets.top + 68, zIndex: 14 }}
      />

      {/* Cabecera flotante con progreso del recorrido y puntos interactivos */}
      <View
        pointerEvents="box-none"
        style={{
          position: "absolute",
          top: insets.top + 10,
          left: 16,
          right: 16,
          zIndex: 20,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <View
          style={{
            flexShrink: 1,
            borderRadius: 999,
            backgroundColor: "rgba(16,14,12,0.78)",
            borderWidth: 1,
            borderColor: "rgba(46,41,36,0.9)",
            paddingHorizontal: 14,
            paddingVertical: 8,
            gap: 5,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Text style={{ color: c.ink, fontFamily: fonts.serif, fontSize: 18 }}>{t.tabSala}</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
              {paradas.map((_, i) => {
                const activo = i === pasoActivo;
                return (
                  <Pressable
                    key={`dot-${i}`}
                    onPress={() => {
                      haptico();
                      irAPaso(i);
                    }}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={`${i + 1}`}
                    style={{ paddingVertical: 4 }}
                  >
                    <View
                      style={{
                        width: activo ? 16 : 6,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: activo ? c.accent : "rgba(183,171,156,0.38)",
                      }}
                    />
                  </Pressable>
                );
              })}
            </View>
          </View>
          <View style={{ height: 2, borderRadius: 1, backgroundColor: "rgba(46,41,36,0.9)", overflow: "hidden" }}>
            <View style={{ width: `${Math.round(fraccionTour * 100)}%`, height: 2, backgroundColor: c.brand }} />
          </View>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          {!reducir ? (
            <BotonRedondo
              c={c}
              nombre="orbita"
              label={t.repetirLlegada}
              size={40}
              onPress={() => {
                setEntradaSeq((s) => s + 1);
                setMostrandoEntrada(true);
              }}
            />
          ) : null}
          <BotonRedondo c={c} nombre="usuario" label={t.tabAjustes} size={40} onPress={() => router.push("/ajustes")} />
        </View>
      </View>

      {/* Entrada desde el universo hasta la sala real */}
      {mostrandoEntrada && !reducir ? (
        <EntradaSalaCosmos
          key={`${episodioId}-${entradaSeq}`}
          lugar={lugar}
          lang={lang}
          width={stageW}
          height={stageH}
          saltarLabel={t.saltar}
          onTerminar={() => setMostrandoEntrada(false)}
        />
      ) : null}
    </View>
  );
}
