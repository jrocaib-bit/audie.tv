import { formatClock, frameAt } from "@audite/domain";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, Image, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { bucleDe, medidasHueco } from "../bucles";
import { uriDeObra } from "../entorno";
import { infoEpisodio } from "../hoy";
import { fichaMuseoObra, seleccionarObraSala, tamanoObraSala } from "../sala";
import { tx } from "../textos";
import { fonts } from "../theme";
import { BotonRedondo } from "../ui/Basicos";
import { Icono } from "../ui/Icono";
import { Pulsable } from "../ui/Pulsable";
import { ScreenHeader } from "../ui/ScreenHeader";
import { VisorObraSala } from "../ui/VisorObraSala";
import { useTema } from "../ui/tema";
import { useCola } from "../ui/useCola";
import { useContextoCatalogo } from "../ui/useHoy";
import { useReproducir } from "../ui/useReproducir";

export default function LaSala() {
  const { c, lang, library } = useTema();
  const t = tx(lang);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const ventana = useWindowDimensions();
  const base = useContextoCatalogo();
  const cola = useCola();
  const reproducir = useReproducir();
  const [zoom, setZoom] = useState(1);
  const [reiniciarSeq, setReiniciarSeq] = useState(0);

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

  const maxAncho = Math.max(200, ventana.width - 52);
  const maxAlto = Math.max(180, Math.min(440, ventana.height - insets.top - 418));
  let medida = tamanoObraSala(ficha.ratio, maxAncho, maxAlto);
  if (bucle && bucle.aspect) {
    const caja = medidasHueco(bucle.aspect, maxAncho + 44, maxAlto / 0.7);
    const ancho = Math.min(caja.width, maxAncho);
    const alto = ancho === caja.width ? caja.height : caja.height * (ancho / caja.width);
    medida = { width: Math.round(ancho), height: Math.round(alto) };
  }

  const ampliada = zoom > 1.05;
  const cargando = library.estadoAudio === "cargando";
  const esActual = library.currentEpisode?.id === episodioId;
  const jugandoEste = esActual && library.playing;
  const duracion = episodioCatalogo?.durationSeconds ?? 0;

  const pulsarPlay = () => {
    if (seleccion.sinEpisodio || !esActual) {
      reproducir(episodioId, { abrir: false });
      return;
    }
    if (library.playing) library.toggle();
    else if (!library.sesion) reproducir(episodioId, { abrir: false });
    else if (library.errorAudio === "premium") router.push("/suscripcion");
    else if (library.errorAudio) library.reintentar();
    else library.toggle();
  };

  const autorYFecha = [ficha.autor, ficha.fecha].filter(Boolean).join(" · ");
  const subtituloEp = [info.libro, info.capitulos].filter(Boolean).join(" · ");
  const etiquetaZoom = `${zoom.toFixed(1).replace(".", lang === "es" ? "," : ".")}×`;

  return (
    <View style={{ flex: 1, backgroundColor: c.gallery }}>
      {src ? (
        <Image
          source={{ uri: uriDeObra(src) }}
          blurRadius={56}
          resizeMode="cover"
          accessibilityElementsHidden
          style={[StyleSheet.absoluteFill, { opacity: 0.14 }]}
        />
      ) : null}

      <LinearGradient
        colors={["rgba(224,196,138,0.18)", "rgba(201,169,110,0.07)", "rgba(12,11,9,0.94)", c.gallery]}
        locations={[0, 0.34, 0.74, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <ScreenHeader
        c={c}
        kicker={subtituloEp || undefined}
        titulo={t.tabSala}
        derecha={
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            {ampliada ? (
              <Pulsable
                onPress={() => setReiniciarSeq((n) => n + 1)}
                label={t.zoomRestablecer}
                haptica
                escala={0.92}
                style={{
                  minHeight: 36,
                  paddingHorizontal: 12,
                  borderRadius: 999,
                  backgroundColor: c.card,
                  borderWidth: 1,
                  borderColor: c.brand,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: c.accent, fontFamily: fonts.medium, fontSize: 13 }}>{etiquetaZoom}</Text>
              </Pulsable>
            ) : null}
            <BotonRedondo c={c} nombre="usuario" label={t.tabAjustes} onPress={() => router.push("/ajustes")} />
          </View>
        }
      />

      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 20, paddingBottom: 10, gap: 14 }}>
        {/* Luz cálida sobre la obra en la pared */}
        <View style={{ alignItems: "center", justifyContent: "center" }}>
          <VisorObraSala
            clave={episodioId}
            src={src}
            alt={ficha.alt || info.titulo}
            ancho={medida.width}
            alto={medida.height}
            bucle={bucle}
            reiniciarSeq={reiniciarSeq}
            onZoomCambia={setZoom}
          />
        </View>

        {/* Cartela discreta de museo: solo campos presentes en los metadatos */}
        {ficha.titulo || autorYFecha || ficha.ubicacion ? (
          <View
            style={{
              width: "100%",
              maxWidth: 360,
              borderRadius: 12,
              backgroundColor: "rgba(27,24,21,0.74)",
              borderWidth: 1,
              borderColor: c.line,
              borderLeftWidth: 2,
              borderLeftColor: c.brand,
              paddingHorizontal: 14,
              paddingVertical: 10,
              gap: 3,
            }}
          >
            {ficha.titulo ? (
              <Text numberOfLines={2} style={{ color: c.ink, fontFamily: fonts.serif, fontSize: 17, lineHeight: 21 }}>
                {ficha.titulo}
              </Text>
            ) : null}
            {autorYFecha ? (
              <Text numberOfLines={1} style={{ color: c.muted, fontFamily: fonts.sans, fontSize: 13, lineHeight: 18 }}>
                {autorYFecha}
              </Text>
            ) : null}
            {ficha.ubicacion ? (
              <Text numberOfLines={1} style={{ color: c.brand, fontFamily: fonts.sans, fontSize: 12, lineHeight: 16 }}>
                {ficha.ubicacion}
              </Text>
            ) : null}
          </View>
        ) : null}

        {/* Controles mínimos de reproducción o invitación directa a escuchar gn-01 */}
        {seleccion.sinEpisodio ? (
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12 }}>
            <Pulsable
              onPress={pulsarPlay}
              label={`${t.escuchar} ${info.titulo}`}
              haptica
              escala={0.94}
              style={{
                minHeight: 44,
                paddingHorizontal: 20,
                borderRadius: 999,
                backgroundColor: c.accent,
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Icono nombre="play" size={18} color={c.accentInk} />
              <Text style={{ color: c.accentInk, fontFamily: fonts.medium, fontSize: 15, fontWeight: "600" }}>{t.escuchar}</Text>
            </Pulsable>
            <Text numberOfLines={1} style={{ color: c.muted, fontFamily: fonts.sans, fontSize: 13 }}>
              {[info.titulo, info.duracion].filter(Boolean).join(" · ")}
            </Text>
          </View>
        ) : (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              paddingHorizontal: 14,
              paddingVertical: 6,
              borderRadius: 999,
              backgroundColor: "rgba(27,24,21,0.82)",
              borderWidth: 1,
              borderColor: c.line,
            }}
          >
            <Pulsable
              onPress={library.anterior}
              disabled={!cola.hayAnterior}
              label={t.anteriorEp}
              haptica
              escala={0.88}
              style={{ width: 38, height: 38, alignItems: "center", justifyContent: "center", opacity: cola.hayAnterior ? 1 : 0.3 }}
            >
              <Icono nombre="anterior" size={20} color={c.ink} />
            </Pulsable>
            <Pulsable
              onPress={pulsarPlay}
              label={jugandoEste ? t.pausar : t.reproducir}
              haptica
              escala={0.9}
              style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: c.accent, alignItems: "center", justifyContent: "center" }}
            >
              {cargando ? <ActivityIndicator color={c.accentInk} size="small" /> : <Icono nombre={jugandoEste ? "pause" : "play"} size={20} color={c.accentInk} />}
            </Pulsable>
            <Pulsable
              onPress={library.siguiente}
              disabled={!cola.haySiguiente}
              label={t.siguiente}
              haptica
              escala={0.88}
              style={{ width: 38, height: 38, alignItems: "center", justifyContent: "center", opacity: cola.haySiguiente ? 1 : 0.3 }}
            >
              <Icono nombre="siguiente" size={20} color={c.ink} />
            </Pulsable>
            {duracion > 0 ? (
              <Text style={{ color: c.muted, fontFamily: fonts.sans, fontSize: 12, fontVariant: ["tabular-nums"], paddingLeft: 4, paddingRight: 4 }}>
                {formatClock(esActual ? library.globalTime : 0)} / {formatClock(duracion)}
              </Text>
            ) : null}
          </View>
        )}
      </View>
    </View>
  );
}
