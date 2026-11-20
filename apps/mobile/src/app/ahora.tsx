import { PLAYBACK_RATES, SLEEP_CHOICES, frameAt } from "@audite/domain";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Image, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { bucleDe, medidasHueco } from "../bucles";
import { vecino } from "../cola";
import { infoEpisodio } from "../hoy";
import { BucleCuadro } from "../bucle-cuadro";
import { baseDeContenido, uriDeObra } from "../entorno";
import { dark, fonts } from "../theme";
import { tx } from "../textos";
import { Boton, Chip } from "../ui/Basicos";
import { Carrusel } from "../ui/Carrusel";
import { Icono } from "../ui/Icono";
import { ObraMarco } from "../ui/ObraMarco";
import { Pulsable } from "../ui/Pulsable";
import { Scrubber } from "../ui/Scrubber";
import { useTema } from "../ui/tema";
import { ProgressBar } from "../ui/ProgressBar";
import { useCola } from "../ui/useCola";
import { useContextoCatalogo, useEpisodioCargado } from "../ui/useHoy";

const c = dark;

export default function NowPlaying() {
  const { library, lang } = useTema();
  const t = tx(lang);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const ventana = useWindowDimensions();
  const cargado = useEpisodioCargado();
  const cola = useCola();
  const base = useContextoCatalogo();
  const [sleepIdx, setSleepIdx] = useState(-1);
  const pedido = useLocalSearchParams<{ e?: string }>().e;
  useEffect(() => {
    if (pedido && pedido !== library.currentEpisode?.id && library.hydrated) library.playEpisode(pedido);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pedido, library.hydrated]);
  const episode = library.currentEpisode;
  if (!episode || !cargado) return null;

  const frame = frameAt(library.catalog.cues, library.catalog.captions, library.globalTime, true);
  const artwork = library.catalog.artworks.find((item) => item.id === frame.artworkId) ?? null;
  const bucle = bucleDe(episode.id);
  const src = artwork ? artwork.publicPath : cargado.info.src;
  const poster = artwork ? `${baseDeContenido()}${artwork.publicPath}` : "";
  const alt = `${artwork?.title[lang] ?? ""}. ${artwork?.artist[lang] ?? ""}`.trim();
  const hayTexto = library.catalog.captions.length > 0;
  const cuando = library.settings.captions && frame.captionText ? frame.captionText : "";

  // La obra se dimensiona con su proporción; el bloque entero se centra en vertical.
  const maxAlto = Math.max(200, ventana.height - insets.top - insets.bottom - 470);
  // Un poco más estrecha que la pantalla para que asomen los vecinos.
  const maxAncho = ventana.width - 64;
  const ratio = cargado.info.ratio;
  let anchoObra = Math.min(maxAncho, maxAlto * ratio);
  let altoObra = anchoObra / ratio;
  if (bucle && (bucle.poster || poster)) {
    const caja = medidasHueco(bucle.aspect, maxAncho + 44, maxAlto / 0.7);
    anchoObra = Math.min(caja.width, maxAncho);
    altoObra = anchoObra === caja.width ? caja.height : caja.height * (anchoObra / caja.width);
  }

  const previo = vecino(cola.ids, cola.pos, -1, cola.grabado);
  const proximo = vecino(cola.ids, cola.pos, 1, cola.grabado);
  const ids = [previo?.id, episode.id, proximo?.id].filter((x): x is string => Boolean(x));
  const centro = previo ? 1 : 0;
  const error = library.errorAudio;
  const cargando = library.estadoAudio === "cargando";
  const ciclarVelocidad = () => {
    const i = PLAYBACK_RATES.indexOf(library.settings.rate);
    library.setRate(PLAYBACK_RATES[(i + 1) % PLAYBACK_RATES.length]!);
  };
  const ciclarSueno = () => {
    const siguiente = sleepIdx + 1 >= SLEEP_CHOICES.length ? -1 : sleepIdx + 1;
    setSleepIdx(siguiente);
    library.setSleep(siguiente < 0 ? null : SLEEP_CHOICES[siguiente]!);
  };
  const sueno = library.sleepLabel ?? t.temporizador;

  const mensaje =
    error === "entrar" ? t.entrarParaEscuchar : error === "premium" ? t.conPremium : error === "proximamente" ? t.proximamente : t.noCargo;
  const accion =
    error === "entrar"
      ? { texto: t.entrar, ir: () => { library.setPendiente(episode.id); router.push("/cuenta"); } }
      : error === "premium"
        ? { texto: t.premium, ir: () => router.push("/suscripcion") }
        : error === "proximamente"
          ? null
          : { texto: t.reintentar, ir: () => library.reintentar() };

  return (
    <View style={{ flex: 1, backgroundColor: c.gallery }}>
      {src ? <Image source={{ uri: uriDeObra(src) }} blurRadius={40} resizeMode="cover" accessibilityElementsHidden style={[StyleSheet.absoluteFill, { opacity: 0.35 }]} /> : null}
      <LinearGradient colors={["rgba(12,11,9,0.2)", "rgba(12,11,9,0.7)", c.gallery]} locations={[0, 0.55, 0.85]} style={StyleSheet.absoluteFill} pointerEvents="none" />
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Pulsable onPress={() => router.back()} label={t.cerrar} hitSlop={8} escala={0.9} style={{ width: 48, height: 48, alignItems: "center", justifyContent: "center" }}>
          <Icono nombre="abajo" size={30} color={c.ink} />
        </Pulsable>
        <Text style={{ color: c.muted, fontFamily: fonts.medium, fontSize: 13, letterSpacing: 1.4, textTransform: "uppercase" }}>{t.ahora}</Text>
        <Pulsable onPress={() => router.push("/creditos")} label={t.creditos} hitSlop={8} escala={0.9} style={{ width: 48, height: 48, alignItems: "center", justifyContent: "center" }}>
          <Icono nombre="info" size={24} color={c.muted} />
        </Pulsable>
      </View>

      <View style={{ flex: 1, justifyContent: "center", gap: 16, paddingBottom: insets.bottom + 12 }}>
        <Carrusel
          n={ids.length}
          indice={centro}
          vista={ventana.width}
          ancho={maxAncho}
          alto={altoObra}
          separacion={14}
          clave={episode.id}
          onCambia={(i) => {
            if (i > centro) library.siguiente();
            else if (i < centro) library.anterior();
          }}
          render={(i, activo) => {
            if (!activo) {
              const info = infoEpisodio(ids[i]!, base);
              const a = Math.min(maxAncho, altoObra * info.ratio);
              return (
                <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                  <ObraMarco src={info.src} style={{ width: a, height: a / info.ratio, borderRadius: 14 }} />
                </View>
              );
            }
            return (
              <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                {bucle && (bucle.poster || poster) ? (
                  <View style={{ width: anchoObra, height: altoObra, borderRadius: 16, overflow: "hidden" }}>
                    <BucleCuadro bucle={bucle} poster={bucle.poster || poster} alt={bucle.alt || alt} />
                  </View>
                ) : (
                  <View style={{ width: anchoObra, height: altoObra, borderRadius: 14, overflow: "hidden", backgroundColor: "#0C0B09", shadowColor: "#000", shadowOpacity: 0.55, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 12 }}>
                    <Image source={{ uri: uriDeObra(src) }} resizeMode="contain" accessibilityLabel={alt || cargado.info.titulo} style={StyleSheet.absoluteFill} />
                  </View>
                )}
              </View>
            );
          }}
        />

        <View style={{ paddingHorizontal: 24, gap: 4 }}>
          <Text numberOfLines={2} style={{ color: c.ink, fontFamily: fonts.serif, fontSize: 30, lineHeight: 34 }}>{cargado.info.titulo}</Text>
          <Text numberOfLines={1} style={{ color: c.muted, fontFamily: fonts.sans, fontSize: 15 }}>{[cargado.info.libro, cargado.info.capitulos].filter(Boolean).join(" · ")}</Text>
        </View>

        <Pulsable onPress={() => router.push("/cola")} label={`${t.aContinuacion}. ${cola.largo}`} escala={0.98} style={{ marginHorizontal: 20, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 18, gap: 8, backgroundColor: "rgba(244,236,226,0.07)" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text numberOfLines={1} style={{ flex: 1, color: c.ink, fontFamily: fonts.medium, fontSize: 14 }}>{cola.largo}</Text>
            <Icono nombre="chevron" size={16} color={c.muted} />
          </View>
          <ProgressBar fraccion={cola.info.fraccion} color={c.accent} pista="rgba(244,236,226,0.16)" alto={4} />
        </Pulsable>

        {cuando && !error ? (
          <View style={{ marginHorizontal: 20, padding: 14, borderRadius: 18, backgroundColor: "rgba(244,236,226,0.07)" }}>
            <Text numberOfLines={3} style={{ color: c.ink, fontFamily: fonts.sans, fontSize: 16, lineHeight: 22 }}>{cuando}</Text>
          </View>
        ) : null}

        {error ? (
          <View style={{ paddingHorizontal: 24, gap: 14, alignItems: "stretch" }}>
            <View style={{ minHeight: 76, borderRadius: 24, padding: 20, justifyContent: "center", backgroundColor: "rgba(244,236,226,0.07)" }}>
              <Text accessibilityRole="alert" style={{ color: c.ink, fontFamily: fonts.serif, fontSize: 24 }}>{mensaje}</Text>
            </View>
            {accion ? <Boton c={c} texto={accion.texto} onPress={accion.ir} /> : null}
          </View>
        ) : (
          <>
            <View style={{ paddingHorizontal: 24 }}>
              <Scrubber valor={library.globalTime} maximo={episode.durationSeconds} onBuscar={(s) => library.seekBy(s - library.globalTime)} color={c.accent} pista="rgba(244,236,226,0.18)" texto={c.muted} etiqueta={t.posicion} />
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 }}>
              <Pulsable onPress={library.anterior} disabled={!cola.hayAnterior} label={t.anteriorEp} haptica escala={0.88} style={{ width: 48, height: 56, alignItems: "center", justifyContent: "center", opacity: cola.hayAnterior ? 1 : 0.3 }}>
                <Icono nombre="anterior" size={28} color={c.ink} />
              </Pulsable>
              <Pulsable onPress={() => library.seekBy(-15)} label="−15" haptica escala={0.88} style={{ width: 52, height: 56, alignItems: "center", justifyContent: "center" }}>
                <Icono nombre="atras" size={36} color={c.ink} />
              </Pulsable>
              <Pulsable onPress={library.toggle} label={cargando ? t.cargando : library.playing ? t.pausar : t.reproducir} haptica escala={0.92} style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: c.accent, alignItems: "center", justifyContent: "center" }}>
                {cargando ? <ActivityIndicator color={c.accentInk} size="large" /> : <Icono nombre={library.playing ? "pause" : "play"} size={36} color={c.accentInk} />}
              </Pulsable>
              <Pulsable onPress={() => library.seekBy(15)} label="+15" haptica escala={0.88} style={{ width: 52, height: 56, alignItems: "center", justifyContent: "center" }}>
                <Icono nombre="adelante" size={36} color={c.ink} />
              </Pulsable>
              <Pulsable onPress={library.siguiente} disabled={!cola.haySiguiente} label={t.siguiente} haptica escala={0.88} style={{ width: 48, height: 56, alignItems: "center", justifyContent: "center", opacity: cola.haySiguiente ? 1 : 0.3 }}>
                <Icono nombre="siguiente" size={28} color={c.ink} />
              </Pulsable>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "center", gap: 10 }}>
              <Chip c={c} icono="velocidad" texto={`${library.settings.rate}×`} onPress={ciclarVelocidad} />
              <Chip c={c} icono="luna" texto={sueno} activo={library.sleepLabel != null} onPress={ciclarSueno} />
              {hayTexto ? <Chip c={c} icono="texto" texto={t.texto} activo={library.settings.captions} onPress={() => library.updateSettings({ captions: !library.settings.captions })} /> : null}
            </View>
          </>
        )}
      </View>
    </View>
  );
}
