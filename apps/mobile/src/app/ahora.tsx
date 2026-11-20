import { PLAYBACK_RATES, SLEEP_CHOICES, frameAt, playableEpisodes } from "@audite/domain";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { bucleDe } from "../bucles";
import { BucleCuadro } from "../bucle-cuadro";
import { baseDeContenido } from "../entorno";
import { dark, fonts } from "../theme";
import { tx } from "../textos";
import { Chip } from "../ui/Basicos";
import { Icono } from "../ui/Icono";
import { ObraMarco } from "../ui/ObraMarco";
import { Pulsable } from "../ui/Pulsable";
import { Scrubber } from "../ui/Scrubber";
import { useTema } from "../ui/tema";
import { useEpisodioCargado } from "../ui/useHoy";

const c = dark;

export default function NowPlaying() {
  const { library, lang } = useTema();
  const t = tx(lang);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const cargado = useEpisodioCargado();
  const [sleepIdx, setSleepIdx] = useState(-1);
  const episode = playableEpisodes(library.catalog)[0];
  if (!episode || !cargado) return null;
  const frame = frameAt(library.catalog.cues, library.catalog.captions, library.globalTime, true);
  const artwork = library.catalog.artworks.find((item) => item.id === frame.artworkId) ?? null;
  const bucle = bucleDe(episode.id);
  const src = artwork ? artwork.publicPath : cargado.info.src;
  const poster = artwork ? `${baseDeContenido()}${artwork.publicPath}` : "";
  const alt = `${artwork?.title[lang] ?? ""}. ${artwork?.artist[lang] ?? ""}`.trim();
  const cuando = library.settings.captions && frame.captionText ? frame.captionText : "";

  const ciclarVelocidad = () => {
    const i = PLAYBACK_RATES.indexOf(library.settings.rate);
    library.setRate(PLAYBACK_RATES[(i + 1) % PLAYBACK_RATES.length]!);
  };
  const ciclarSueno = () => {
    const siguiente = sleepIdx + 1 >= SLEEP_CHOICES.length ? -1 : sleepIdx + 1;
    setSleepIdx(siguiente);
    library.setSleep(siguiente < 0 ? null : SLEEP_CHOICES[siguiente]!);
  };
  const sueno = library.sleepLabel ?? t.sinTemporizador;

  return (
    <View style={{ flex: 1, backgroundColor: c.gallery }}>
      <LinearGradient colors={["#241E18", c.gallery]} style={{ position: "absolute", top: 0, left: 0, right: 0, height: 420 }} pointerEvents="none" />
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Pulsable onPress={() => router.back()} label={t.cerrar} hitSlop={8} escala={0.9} style={{ width: 48, height: 48, alignItems: "center", justifyContent: "center" }}>
          <Icono nombre="abajo" size={30} color={c.ink} />
        </Pulsable>
        <Text style={{ color: c.muted, fontFamily: fonts.medium, fontSize: 13, letterSpacing: 1.4, textTransform: "uppercase" }}>{t.ahora}</Text>
        <Pulsable onPress={() => router.push("/creditos")} label={t.creditos} hitSlop={8} escala={0.9} style={{ width: 48, height: 48, alignItems: "center", justifyContent: "center" }}>
          <Icono nombre="info" size={24} color={c.muted} />
        </Pulsable>
      </View>

      <View style={{ flex: 1, minHeight: 180, marginHorizontal: 16, marginVertical: 8, borderRadius: 24, overflow: "hidden" }}>
        {bucle && (bucle.poster || poster) ? (
          <BucleCuadro bucle={bucle} poster={bucle.poster || poster} alt={bucle.alt || alt} />
        ) : (
          <ObraMarco src={src} alt={alt} style={{ flex: 1 }} />
        )}
      </View>

      <View style={{ paddingHorizontal: 24, gap: 4 }}>
        <Text numberOfLines={2} style={{ color: c.ink, fontFamily: fonts.serif, fontSize: 30, lineHeight: 34 }}>{cargado.info.titulo}</Text>
        <Text numberOfLines={1} style={{ color: c.muted, fontFamily: fonts.sans, fontSize: 15 }}>{[cargado.info.libro, cargado.info.capitulos].filter(Boolean).join(" · ")}</Text>
      </View>

      {cuando ? (
        <View style={{ marginHorizontal: 20, marginTop: 12, padding: 14, borderRadius: 18, backgroundColor: "rgba(244,236,226,0.07)" }}>
          <Text numberOfLines={3} style={{ color: c.ink, fontFamily: fonts.sans, fontSize: 16, lineHeight: 22 }}>{cuando}</Text>
        </View>
      ) : null}

      <View style={{ paddingHorizontal: 24, marginTop: 8 }}>
        <Scrubber valor={library.globalTime} maximo={episode.durationSeconds} onBuscar={(s) => library.seekBy(s - library.globalTime)} color={c.accent} pista="rgba(244,236,226,0.18)" texto={c.muted} etiqueta={t.posicion} />
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 28, marginTop: 4 }}>
        <Pulsable onPress={() => library.seekBy(-15)} label="−15" haptica escala={0.88} style={{ width: 56, height: 56, alignItems: "center", justifyContent: "center" }}>
          <Icono nombre="atras" size={38} color={c.ink} />
        </Pulsable>
        <Pulsable onPress={library.toggle} label={library.playing ? t.pausar : t.reproducir} haptica escala={0.92} style={{ width: 84, height: 84, borderRadius: 42, backgroundColor: c.accent, alignItems: "center", justifyContent: "center" }}>
          <Icono nombre={library.playing ? "pause" : "play"} size={38} color={c.accentInk} />
        </Pulsable>
        <Pulsable onPress={() => library.seekBy(15)} label="+15" haptica escala={0.88} style={{ width: 56, height: 56, alignItems: "center", justifyContent: "center" }}>
          <Icono nombre="adelante" size={38} color={c.ink} />
        </Pulsable>
      </View>

      <View style={{ flexDirection: "row", justifyContent: "center", gap: 10, paddingTop: 12, paddingBottom: insets.bottom + 16 }}>
        <Chip c={c} icono="velocidad" texto={`${library.settings.rate}×`} onPress={ciclarVelocidad} />
        <Chip c={c} icono="luna" texto={sueno} activo={library.sleepLabel != null} onPress={ciclarSueno} />
        <Chip c={c} icono="texto" texto={t.texto} activo={library.settings.captions} onPress={() => library.updateSettings({ captions: !library.settings.captions })} />
      </View>
    </View>
  );
}
