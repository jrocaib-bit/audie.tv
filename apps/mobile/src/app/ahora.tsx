import { idiomaContenido, PLAYBACK_RATES, SLEEP_CHOICES, creditoVisible, formatClock, frameAt, playableEpisodes, t } from "@audite/domain";
import { useRouter } from "expo-router";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { useMobileLibrary } from "../state";

export default function NowPlaying() {
  const library = useMobileLibrary();
  const router = useRouter();
  const locale = library.settings.uiLocale;
  const episode = playableEpisodes(library.catalog)[0];
  if (!episode) return null;
  const frame = frameAt(library.catalog.cues, library.catalog.captions, library.globalTime, true);
  const artwork = library.catalog.artworks.find((item) => item.id === frame.artworkId) ?? null;
  const base = process.env.EXPO_PUBLIC_CONTENT_BASE ?? "http://127.0.0.1:43123";
  const image = artwork ? { uri: `${base}${artwork.publicPath}` } : null;
  return (
    <View style={{ flex: 1, backgroundColor: "#0c0b09" }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", padding: 16 }}>
        <Pressable onPress={() => router.back()} style={{ minHeight: 44, justifyContent: "center" }}>
          <Text style={{ color: "#e0c48a" }}>{t(locale, "navListen")}</Text>
        </Pressable>
        <Text style={{ color: "#b7ab9c" }}>{t(locale, "nowKicker")}</Text>
      </View>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        {image != null ? (
          <Image source={image} resizeMode="contain" accessibilityLabel={`${artwork?.title.es}. ${artwork?.artist.es}`} style={{ width: "100%", height: "100%" }} />
        ) : null}
      </View>
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
    </View>
  );
}

const pill = { minHeight: 48, minWidth: 48, borderRadius: 999, borderWidth: 1, borderColor: "rgba(255,255,255,0.2)", alignItems: "center" as const, justifyContent: "center" as const, paddingHorizontal: 12 };
const pillText = { color: "#f4ece2" };
