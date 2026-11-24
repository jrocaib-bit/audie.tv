import { idiomaContenido, PLAYBACK_RATES, SLEEP_CHOICES, creditoVisible, formatClock, frameAt, playableEpisodes, t, textosPanel } from "@audite/domain";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { supabaseApp } from "../auth";
import { PanelTextoApp } from "../panel-texto";
import { cargarTexto, type CargaTexto } from "../texto";
import { bucleDe } from "../bucles";
import { BucleCuadro } from "../bucle-cuadro";
import { LibrosDelEpisodio } from "../libros/recomendados";
import { useMobileLibrary } from "../state";

export default function NowPlaying() {
  const library = useMobileLibrary();
  const router = useRouter();
  const locale = library.settings.uiLocale;
  const episode = playableEpisodes(library.catalog)[0];
  const texto = useTextoEpisodio(episode?.id ?? null, idiomaContenido(locale));
  const [verTexto, setVerTexto] = useState(false);
  if (!episode) return null;
  const hayTexto = texto.carga.tipo !== "apagado" && texto.carga.tipo !== "cargando";
  const tx = textosPanel(locale);
  const frame = frameAt(library.catalog.cues, library.catalog.captions, library.globalTime, true);
  const artwork = library.catalog.artworks.find((item) => item.id === frame.artworkId) ?? null;
  const base = process.env.EXPO_PUBLIC_CONTENT_BASE ?? "http://127.0.0.1:43123";
  const image = artwork ? { uri: `${base}${artwork.publicPath}` } : null;
  const bucle = bucleDe(episode.id);
  const alt = `${artwork?.title.es ?? ""}. ${artwork?.artist.es ?? ""}`.trim();
  return (
    <View style={{ flex: 1, backgroundColor: "#0c0b09" }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", padding: 16 }}>
        <Pressable onPress={() => router.back()} style={{ minHeight: 44, justifyContent: "center" }}>
          <Text style={{ color: "#e0c48a" }}>{t(locale, "navListen")}</Text>
        </Pressable>
        <Text style={{ color: "#b7ab9c" }}>{t(locale, "nowKicker")}</Text>
        {hayTexto ? (
          <Pressable accessibilityRole="button" accessibilityState={{ selected: verTexto }} onPress={() => setVerTexto((valor) => !valor)} style={{ minHeight: 44, minWidth: 44, justifyContent: "center", paddingHorizontal: 8 }}>
            <Text style={{ color: "#e0c48a", textDecorationLine: verTexto ? "underline" : "none" }}>{tx.titulo}</Text>
          </Pressable>
        ) : null}
      </View>
      {hayTexto && verTexto ? (
        <View style={{ flex: 1 }}>
          <PanelTextoApp
            carga={texto.carga}
            uiLocale={locale}
            tiempo={library.globalTime}
            onSaltar={library.seek}
            reducirMovimiento={library.settings.reduceMotion}
            onEntrar={() => router.push("/entrar")}
            onSuscribir={() => router.push("/suscripcion")}
            onReintentar={texto.reintentar}
          />
        </View>
      ) : (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        {bucle && (bucle.poster || image) ? (
          <BucleCuadro bucle={bucle} poster={bucle.poster || image?.uri || ""} alt={bucle.alt || alt} />
        ) : image != null ? (
          <Image source={image} resizeMode="contain" accessibilityLabel={alt} style={{ width: "100%", height: "100%" }} />
        ) : null}
      </View>
      )}
      <View style={{ backgroundColor: "#171512", padding: 16, gap: 8 }}>
        <Text style={{ color: "#f4ece2", fontSize: 22, lineHeight: 28 }}>{library.settings.captions ? frame.captionText || " " : t(locale, "episodeCaptionsOff")}</Text>
        <Text style={{ color: "#b7ab9c", fontSize: 14 }}>
          {creditoVisible(library.catalog.fuenteTexto[idiomaContenido(locale)], t(locale, "sourceLabel"), t(locale, "sourcePending"))}
        </Text>
        {artwork ? (
          <Text style={{ color: "#b7ab9c", fontSize: 13, lineHeight: 18 }}>
            {artwork.title.es} · {artwork.artist.es} · {artwork.date}
            {artwork.crop ? ` · ${t(locale, "episodeDetail")}` : ""}
            {"\n"}
            {artwork.title.en} · {artwork.artist.en}
            {"\n"}
            {artwork.credit}
          </Text>
        ) : null}
      </View>
      <ScrollView horizontal contentContainerStyle={{ gap: 8, padding: 16, alignItems: "center" }}>
        <Pressable onPress={() => library.seekBy(-30)} style={pill}><Text style={pillText}>−30</Text></Pressable>
        <Pressable onPress={() => library.seekBy(-15)} style={pill}><Text style={pillText}>−15</Text></Pressable>
        <Pressable onPress={library.toggle} style={[pill, { backgroundColor: "#e0c48a" }]}>
          <Text style={{ color: "#1a140c" }}>{library.playing ? t(locale, "playerPause") : t(locale, "playerPlay")}</Text>
        </Pressable>
        <Pressable onPress={() => library.seekBy(15)} style={pill}><Text style={pillText}>+15</Text></Pressable>
        <Pressable onPress={() => library.seekBy(30)} style={pill}><Text style={pillText}>+30</Text></Pressable>
        {PLAYBACK_RATES.map((rate) => (
          <Pressable key={rate} onPress={() => library.setRate(rate)} style={pill}>
            <Text style={{ color: library.settings.rate === rate ? "#e0c48a" : "#f4ece2" }}>{rate}×</Text>
          </Pressable>
        ))}
        <Pressable onPress={() => library.setSleep(null)} style={pill}><Text style={pillText}>{library.sleepLabel ?? t(locale, "sleepOff")}</Text></Pressable>
        {SLEEP_CHOICES.map((minutes) => (
          <Pressable key={minutes} onPress={() => library.setSleep(minutes)} style={pill}>
            <Text style={pillText}>{minutes}</Text>
          </Pressable>
        ))}
        <Text style={{ color: "#b7ab9c" }}>{formatClock(library.globalTime)}</Text>
      </ScrollView>
      <ScrollView style={{ flexGrow: 0, maxHeight: 190 }}>
        <LibrosDelEpisodio episodioId={episode.id} />
      </ScrollView>
    </View>
  );
}

/** Pide el texto a la API con el token de la sesión. Con la función apagada en el servidor, queda en "apagado". */
function useTextoEpisodio(id: string | null, idioma: "es" | "en"): { carga: CargaTexto; reintentar: () => void } {
  const [carga, setCarga] = useState<CargaTexto>({ tipo: "cargando" });
  const [intento, setIntento] = useState(0);
  useEffect(() => {
    if (!id) return;
    let vivo = true;
    setCarga({ tipo: "cargando" });
    void (async () => {
      const sesion = await supabaseApp()?.auth.getSession();
      const token = sesion?.data.session?.access_token ?? null;
      const base = process.env.EXPO_PUBLIC_CONTENT_BASE ?? "http://127.0.0.1:43123";
      const resultado = await cargarTexto({ base, id, idioma, token });
      if (vivo) setCarga(resultado);
    })().catch(() => {
      if (vivo) setCarga({ tipo: "error" });
    });
    return () => {
      vivo = false;
    };
  }, [id, idioma, intento]);
  return { carga, reintentar: () => setIntento((valor) => valor + 1) };
}

const pill = { minHeight: 48, minWidth: 48, borderRadius: 999, borderWidth: 1, borderColor: "rgba(255,255,255,0.2)", alignItems: "center" as const, justifyContent: "center" as const, paddingHorizontal: 12 };
const pillText = { color: "#f4ece2" };
