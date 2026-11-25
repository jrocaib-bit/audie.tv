import { frameAt } from "@audite/domain";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Image, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions, type LayoutChangeEvent } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Defs, Ellipse, RadialGradient, Stop } from "react-native-svg";
import { BucleCuadro } from "../bucle-cuadro";
import { bucleDe, medidasHueco } from "../bucles";
import { uriDeObra } from "../entorno";
import { infoEpisodio } from "../hoy";
import { fichaMuseoObra, seleccionarObraSala, tamanoObraSala } from "../sala";
import { ESPACIOS, VIAJES, componerSala, espacioDeEpisodio, mascaraDeObra, obraCompleta } from "../sala-assets";
import { resolverLugarObra } from "../sala-lugares";
import { debeLanzarEntradaSala, debeMostrarEntradaSala, marcarEntradaVista, esObraSalaAbierta, invitacionSala, OBRAS_SALA_ABIERTAS, paradasSegunSesion, textoSalaInvitacion } from "../sala-cuenta";
import { camaraDeParadas, paradasDeEpisodio } from "../sala-recorrido";
import { claveMapTiles, decidirVuelo, planDeVuelo, tiemposVueloVivo } from "../sala-vuelo";
import { tx } from "../textos";
import { fonts } from "../theme";
import { BotonRedondo } from "../ui/Basicos";
import { EntradaSalaViaje, tiemposViaje } from "../ui/EntradaSalaViaje";
import { Icono } from "../ui/Icono";
import { useHuecoInferior } from "../ui/barra-flotante";
import { Pulsable } from "../ui/Pulsable";
import { haptico, useMovimientoReducido, useTema } from "../ui/tema";
import { useContextoCatalogo } from "../ui/useHoy";
import { useReproducir } from "../ui/useReproducir";
import { useSesion } from "../ui/useSesion";

export default function LaSala() {
  const { c, lang, library } = useTema();
  const t = tx(lang);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const hueco = useHuecoInferior();
  const ventana = useWindowDimensions();
  const reducir = useMovimientoReducido();
  const base = useContextoCatalogo();
  const reproducir = useReproducir();

  const sesion = useSesion();
  const [ejemplo, setEjemplo] = useState<string | null>(null);

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

  const registrado = Boolean(sesion?.userId);
  const episodioId = !registrado && ejemplo && esObraSalaAbierta(ejemplo) ? ejemplo : seleccion.episodioId;
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
  const srcBase = ficha.src || info.src;
  // Obras que la sala muestra enteras (p. ej. el tondo de gn-01, no su recorte 16:9 de portada).
  const completa = useMemo(() => (srcBase ? obraCompleta(srcBase) : null), [srcBase]);
  const src = completa?.src ?? srcBase;
  const uri = src ? uriDeObra(src) : "";

  // Sede, sala concreta y medio reales del episodio (datos del museo; ver sala-espacios.json).
  const espacioEp = useMemo(() => espacioDeEpisodio(episodioId), [episodioId]);
  const espacio = ESPACIOS[espacioEp.espacio];
  const medio = espacioEp.medio;
  const lugar = useMemo(
    () => resolverLugarObra(ficha.ubicacion, episodioId, undefined, espacioEp.sede ?? undefined),
    [episodioId, espacioEp.sede, ficha.ubicacion],
  );
  const viaje = VIAJES[espacioEp.sede ?? "sin-lugar"];

  // Vuelo en vivo (Google 3D Tiles) si hay clave, no se pidió reducir movimiento y la sede lo tiene activo; si no, entrada v2.
  const [vueloFallido, setVueloFallido] = useState(false);
  const clave = claveMapTiles();
  const modoVuelo = decidirVuelo({ clave, reducir, sede: espacioEp.sede, soportado: Platform.OS !== "web", fallido: vueloFallido });
  const planVuelo = useMemo(
    () => (espacioEp.sede ? planDeVuelo(espacioEp.sede, { margenInferior: hueco + 6 }) : null),
    [espacioEp.sede, hueco],
  );
  const entradaPermitida = debeMostrarEntradaSala(sesion, reducir);
  const vuelo = useMemo(
    () => (entradaPermitida && modoVuelo === "vivo" && planVuelo ? { plan: planVuelo, clave } : null),
    [clave, entradaPermitida, modoVuelo, planVuelo],
  );
  const tiempos = useMemo(() => (vuelo ? tiemposVueloVivo() : tiemposViaje(Boolean(viaje.edificio))), [vuelo, viaje.edificio]);

  const { paradas: paradasTodas } = useMemo(
    () =>
      paradasDeEpisodio(episodioId, lang, {
        tituloObra: ficha.titulo,
        tituloEpisodio: info.titulo,
        resumen: episodioCatalogo?.summary?.[lang] || episodioCatalogo?.summary?.es || "",
      }),
    [episodioCatalogo?.summary, episodioId, ficha.titulo, info.titulo, lang],
  );
  // Candado: sin sesión solo el adelanto (obra + título); el scrollytelling y los textos, con cuenta.
  const { paradas, bloqueado } = useMemo(() => paradasSegunSesion(paradasTodas, sesion, episodioId), [paradasTodas, sesion, episodioId]);
  const copySala = textoSalaInvitacion(lang);

  // Tamaño de la obra entera al empezar/terminar: siempre contenida y nunca recortada.
  const maxAncho = Math.max(180, Math.round(stageW * 0.84));
  const maxAlto = Math.max(170, Math.round(stageH * 0.5));
  let ratioObra = completa?.ratio ?? ficha.ratio;
  if (bucle && bucle.aspect) {
    const caja = medidasHueco(bucle.aspect, 1000, 1000);
    if (caja.width > 0 && caja.height > 0) ratioObra = caja.width / caja.height;
  }
  const centroObraY = Math.round(stageH * 0.38);
  const composicion = useMemo(
    () => componerSala({ espacio, medio, ratio: ratioObra, stageW, stageH, centroY: centroObraY, maxAncho, maxAlto }),
    [centroObraY, espacio, maxAlto, maxAncho, medio, ratioObra, stageH, stageW],
  );
  const medida = composicion.obra.width > 0 ? composicion.obra : tamanoObraSala(ratioObra, maxAncho, maxAlto);
  const marco = composicion.marco;
  const marcoLeft = Math.round((stageW - medida.width) / 2);
  const marcoTop = Math.round(centroObraY - medida.height / 2);
  const enVentana = espacio.tipo === "ventana";
  const mascara = useMemo(() => mascaraDeObra(src || ""), [src]);
  // Radio del contenedor de cámara: abarca toda la sala desde el centro de la obra.
  const radioCamara = Math.ceil(
    Math.max(
      stageW,
      stageH,
      Math.abs(composicion.sala.left - stageW / 2),
      Math.abs(composicion.sala.left + composicion.sala.width - stageW / 2),
      Math.abs(composicion.sala.top - centroObraY),
      Math.abs(composicion.sala.top + composicion.sala.height - centroObraY),
    ),
  );
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
  const [mostrandoEntrada, setMostrandoEntrada] = useState(() => debeLanzarEntradaSala(entradaPermitida, episodioId));
  const [entradaSeq, setEntradaSeq] = useState(0);
  const entradaEnCurso = useRef<string | null>(null);
  // Reloj de la entrada (ms). Fuera de la entrada vale el total: la cámara queda asentada en la sala.
  const reloj = useSharedValue(entradaPermitida ? 0 : 100000);
  useEffect(() => {
    if (!mostrandoEntrada || !entradaPermitida) reloj.value = 100000;
  }, [mostrandoEntrada, entradaPermitida, reloj]);

  // Al cambiar de episodio se reinicia el recorrido. La entrada solo se lanza si la obra no se vio en la sesión.
  useEffect(() => {
    if (!entradaPermitida) {
      setMostrandoEntrada(false);
      return;
    }
    if (entradaEnCurso.current === episodioId) return;
    setPasoActivo(0);
    scrollY.value = 0;
    ultimoPaso.value = 0;
    scrollRef.current?.scrollTo({ y: 0, animated: false });
    const lanzar = debeLanzarEntradaSala(true, episodioId);
    if (lanzar) {
      marcarEntradaVista(episodioId);
      entradaEnCurso.current = episodioId;
    }
    setMostrandoEntrada(lanzar);
    setVueloFallido(false);
  }, [episodioId, entradaPermitida, scrollY, ultimoPaso]);

  const alVueloFallido = useCallback(() => setVueloFallido(true), []);
  const alTerminarEntrada = useCallback(() => {
    setMostrandoEntrada(false);
    haptico();
  }, []);

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
    // Entrada en la sala: de la sala entera (plano general) a la obra, con el mismo reloj del viaje.
    const k = interpolate(reloj.value, [tiempos.salaIn, tiempos.total], [0, 1], Extrapolation.CLAMP);
    const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
    const sE = composicion.entrada.scale + (1 - composicion.entrada.scale) * e;
    const txE = composicion.entrada.tx * (1 - e);
    const tyE = composicion.entrada.ty * (1 - e);
    return {
      transform: [{ translateX: txVal + txE }, { translateY: tyVal + tyE }, { scale: scale * sE }],
    };
  }, [rangos, composicion, tiempos]);

  // Al acercarse a un detalle la sala se atenúa (sin desaparecer) para que mande la obra.
  const estiloPenumbra = useAnimatedStyle(() => {
    if (rangos.inputRange.length < 2) return { opacity: 0 };
    const op = interpolate(scrollY.value, rangos.inputRange, rangos.salaOps, Extrapolation.CLAMP);
    return { opacity: (1 - op) * 0.8 };
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
  const lugarTexto = useMemo(() => {
    const edificio = lugar.edificio[lang] || lugar.edificio.es;
    const ciudad = lugar.ciudad[lang] || lugar.ciudad.es;
    if (!edificio) return "";
    const sala =
      espacioEp.galeria
        ? t.galeriaN.replace("{n}", String(Number(espacioEp.galeria) || espacioEp.galeria))
        : espacioEp.expuesta === false
          ? t.noExpuesta
          : "";
    return [edificio, ciudad, sala].filter(Boolean).join(" · ");
  }, [espacioEp.expuesta, espacioEp.galeria, lang, lugar.ciudad, lugar.edificio, t.galeriaN, t.noExpuesta]);

  const contenidoObra =
    bucle && (bucle.poster || uri) ? (
      <BucleCuadro bucle={bucle} poster={bucle.poster || uri} alt={bucle.alt || ficha.alt || info.titulo} />
    ) : uri ? (
      <Image source={{ uri }} resizeMode="contain" accessibilityLabel={ficha.alt || info.titulo} style={StyleSheet.absoluteFill} />
    ) : null;

  return (
    <View onLayout={onLayoutStage} style={{ flex: 1, backgroundColor: bloqueado ? "#0C0B09" : c.gallery, overflow: "hidden" }}>
      {/* Sala real (fotográfica) y obra enmarcada comparten la misma cámara, con origen en el centro de la obra */}
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: "absolute",
            left: stageW / 2 - radioCamara,
            top: centroObraY - radioCamara,
            width: radioCamara * 2,
            height: radioCamara * 2,
          },
          estiloCamara,
        ]}
      >
        <View style={{ position: "absolute", left: radioCamara - stageW / 2, top: radioCamara - centroObraY, width: stageW, height: stageH }}>
          {!bloqueado ? (
          <Image
            source={espacio.imagen}
            resizeMode="stretch"
            accessibilityIgnoresInvertColors
            style={{
              position: "absolute",
              left: composicion.sala.left,
              top: composicion.sala.top,
              width: composicion.sala.width,
              height: composicion.sala.height,
            }}
          />
          ) : null}

          {/* Foco cálido sobre la pared, o contraluz de la ventana */}
          {!bloqueado ? (
          <Svg style={{ position: "absolute", left: 0, top: 0 }} width={stageW} height={stageH}>
            <Defs>
              <RadialGradient id="focoSala" cx="50%" cy="50%" rx="50%" ry="50%">
                <Stop offset="0%" stopColor={enVentana ? "#FFF6E2" : "#FFD9A0"} stopOpacity={enVentana ? 0.34 : 0.3} />
                <Stop offset="55%" stopColor={enVentana ? "#FFE9BF" : "#F2C27E"} stopOpacity={0.1} />
                <Stop offset="100%" stopColor="#F2C27E" stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Ellipse
              cx={stageW / 2}
              cy={centroObraY - medida.height * 0.12}
              rx={(medida.width + marco * 2) * 0.98 + 30}
              ry={(medida.height + marco * 2) * 0.9 + 40}
              fill="url(#focoSala)"
            />
          </Svg>
          ) : null}

          {!bloqueado ? <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: "#060508" }, estiloPenumbra]} /> : null}

          {/* La obra real, entera y sin recortar, con su marco y en perspectiva frontal */}
          <View
            style={{
              position: "absolute",
              left: marcoLeft - marco,
              top: marcoTop - marco,
              width: medida.width + marco * 2,
              height: medida.height + marco * 2,
              borderRadius: medio === "pintura" ? 2 : 1,
              backgroundColor: medio === "estampa" || medio === "lamina" ? "#F2EDE3" : "transparent",
              borderWidth: medio === "estampa" || medio === "lamina" ? 3 : 0,
              borderColor: "#1C1712",
              shadowColor: enVentana ? "#FFF1D0" : "#000000",
              shadowOpacity: enVentana ? 0.85 : 0.6,
              shadowRadius: enVentana ? 26 : 16,
              shadowOffset: { width: 0, height: enVentana ? 0 : 12 },
              elevation: enVentana ? 0 : 14,
            }}
          >
            {medio === "pintura" ? (
              <>
                <LinearGradient
                  colors={["#5E441E", "#C9A562", "#8A6A36", "#E2C584", "#6E5226"]}
                  locations={[0, 0.28, 0.5, 0.74, 1]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[StyleSheet.absoluteFill, { borderRadius: 2 }]}
                />
                <View
                  style={{
                    position: "absolute",
                    left: marco - 3,
                    top: marco - 3,
                    width: medida.width + 6,
                    height: medida.height + 6,
                    borderWidth: 3,
                    borderColor: "rgba(38,26,10,0.85)",
                  }}
                />
              </>
            ) : null}
            <View
              style={{
                position: "absolute",
                left: marco - (medio === "estampa" || medio === "lamina" ? 3 : 0),
                top: marco - (medio === "estampa" || medio === "lamina" ? 3 : 0),
                width: medida.width,
                height: medida.height,
                overflow: "hidden",
                backgroundColor: mascara ? "transparent" : enVentana ? "#FFF7E6" : "#0C0B09",
              }}
            >
              {mascara ? (
                // Medallón completo recortado solo de su fondo fotográfico negro: la luz de la ventana lo rodea.
                <View
                  style={{
                    position: "absolute",
                    left: (mascara.cx - mascara.r) * medida.width,
                    top: mascara.cy * medida.height - mascara.r * medida.width,
                    width: mascara.r * 2 * medida.width,
                    height: mascara.r * 2 * medida.width,
                    borderRadius: mascara.r * medida.width,
                    overflow: "hidden",
                  }}
                >
                  <View
                    style={{
                      position: "absolute",
                      left: -(mascara.cx - mascara.r) * medida.width,
                      top: -(mascara.cy * medida.height - mascara.r * medida.width),
                      width: medida.width,
                      height: medida.height,
                    }}
                  >
                    {contenidoObra}
                  </View>
                </View>
              ) : (
                contenidoObra
              )}
            </View>
          </View>
        </View>
      </Animated.View>

      {/* Viñeta suave para que el texto se lea sobre la sala */}
      <LinearGradient
        pointerEvents="none"
        colors={["rgba(8,7,6,0.38)", "rgba(8,7,6,0)", "rgba(8,7,6,0)", "rgba(8,7,6,0.5)"]}
        locations={[0, 0.2, 0.62, 1]}
        style={StyleSheet.absoluteFill}
      />

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
                paddingBottom: 18 + hueco,
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

                {bloqueado ? (
                  <View style={{ gap: 10 }} testID="sala-candado">
                    <Text style={{ color: "rgba(244,236,226,0.9)", fontFamily: fonts.sans, fontSize: 15, lineHeight: 22 }}>{invitacionSala(lang)}</Text>
                    <View style={{ flexDirection: "row", gap: 10 }}>
                      <Pulsable onPress={() => router.push("/cuenta")} label={t.salaCrearCuenta} haptica escala={0.94}
                        style={{ minHeight: 40, paddingHorizontal: 16, borderRadius: 999, backgroundColor: c.accent, justifyContent: "center" }}>
                        <Text style={{ color: c.accentInk, fontFamily: fonts.medium, fontSize: 14, fontWeight: "600" }}>{t.salaCrearCuenta}</Text>
                      </Pulsable>
                      <Pulsable onPress={() => router.push("/entrar")} label={t.entrar} haptica escala={0.94}
                        style={{ minHeight: 40, paddingHorizontal: 16, borderRadius: 999, borderWidth: 1, borderColor: c.accent, justifyContent: "center" }}>
                        <Text style={{ color: c.accent, fontFamily: fonts.medium, fontSize: 14 }}>{t.entrar}</Text>
                      </Pulsable>
                    </View>
                  </View>
                ) : parada.texto ? (
                  <Text style={{ color: "rgba(244,236,226,0.9)", fontFamily: fonts.sans, fontSize: 15, lineHeight: 22 }}>
                    {parada.texto}
                  </Text>
                ) : null}

                {esApertura && !bloqueado ? (
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

                {esCierre && (lugarTexto || ficha.ubicacion) ? (
                  <Text style={{ color: c.brand, fontFamily: fonts.sans, fontSize: 12, lineHeight: 17, paddingTop: 4 }}>
                    {t.estasEn} {lugarTexto || ficha.ubicacion}
                  </Text>
                ) : null}
              </View>
            </View>
          );
        })}
      </Animated.ScrollView>

      {/* Puntos tocables sobre los detalles reales cuando se contempla la obra entera */}
      {detalles.length > 0 && !mostrandoEntrada && (pasoActivo === 0 || pasoActivo === paradas.length - 1) ? (
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
            {registrado && !seleccion.sinEpisodio ? (
              <Text style={{ color: c.brand, fontFamily: fonts.medium, fontSize: 11, letterSpacing: 0.4, flexShrink: 1 }} numberOfLines={1}>{copySala.escuchando}</Text>
            ) : null}
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
          {entradaPermitida ? (
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

      {!registrado ? (
        <View
          pointerEvents="box-none"
          style={{
            position: "absolute",
            top: insets.top + 78,
            left: 16,
            right: 16,
            zIndex: 20,
            borderRadius: 20,
            backgroundColor: "rgba(16,14,12,0.88)",
            borderWidth: 1,
            borderColor: "rgba(46,41,36,0.95)",
            paddingHorizontal: 14,
            paddingVertical: 12,
            gap: 8,
          }}
          testID="sala-invitacion"
        >
          <Text style={{ color: c.ink, fontFamily: fonts.serif, fontSize: 16, lineHeight: 20 }}>{copySala.lede}</Text>
          <Text style={{ color: "rgba(244,236,226,0.9)", fontFamily: fonts.sans, fontSize: 13, lineHeight: 18 }}>{copySala.cuerpo}</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {OBRAS_SALA_ABIERTAS.map((id) => (
              <Pulsable
                key={id}
                onPress={() => setEjemplo(id)}
                label={`${copySala.gratis} ${id}`}
                haptica
                escala={0.94}
                style={{
                  minHeight: 32,
                  paddingHorizontal: 12,
                  borderRadius: 999,
                  backgroundColor: (ejemplo ?? episodioId) === id ? c.accent : "transparent",
                  borderWidth: 1,
                  borderColor: c.accent,
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: (ejemplo ?? episodioId) === id ? c.accentInk : c.accent, fontFamily: fonts.medium, fontSize: 12 }}>{copySala.gratis} {id.toUpperCase()}</Text>
              </Pulsable>
            ))}
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            <Pulsable onPress={() => router.push("/cuenta")} label={t.salaCrearCuenta} haptica escala={0.94}
              style={{ minHeight: 36, paddingHorizontal: 14, borderRadius: 999, backgroundColor: c.accent, justifyContent: "center" }}>
              <Text style={{ color: c.accentInk, fontFamily: fonts.medium, fontSize: 13, fontWeight: "600" }}>{t.salaCrearCuenta}</Text>
            </Pulsable>
            <Pulsable onPress={() => router.push("/entrar")} label={t.entrar} haptica escala={0.94}
              style={{ minHeight: 36, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, borderColor: c.accent, justifyContent: "center" }}>
              <Text style={{ color: c.accent, fontFamily: fonts.medium, fontSize: 13 }}>{t.entrar}</Text>
            </Pulsable>
          </View>
        </View>
      ) : null}

      {/* Entrada fotorrealista desde el espacio hasta la sala real */}
      {mostrandoEntrada && entradaPermitida ? (
        <EntradaSalaViaje
          key={`${episodioId}-${entradaSeq}`}
          viaje={viaje}
          lugar={lugar}
          lang={lang}
          saltarLabel={t.saltar}
          topInset={insets.top}
          bottomInset={hueco}
          reloj={reloj}
          tiempos={tiempos}
          vuelo={vuelo}
          onVueloFallido={alVueloFallido}
          onTerminar={alTerminarEntrada}
        />
      ) : null}
    </View>
  );
}
