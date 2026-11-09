import { capituloDePrueba, estadoTiempos, tiemposDeManifiesto } from "@audite/domain";
import { useState } from "react";
import { Pressable, ScrollView, Text } from "react-native";
import { useMobileLibrary } from "../state";
import { dark, light, ui } from "../theme";

export default function Leer() {
  const library = useMobileLibrary();
  const locale = library.settings.uiLocale;
  const colors = library.settings.theme === "light" ? light : dark;
  const [sincronizada, setSincronizada] = useState(false);
  const capitulo = capituloDePrueba("gn", 1, locale, process.env.EXPO_PUBLIC_AUDITE_TEXTO_URL);
  const tiempos = estadoTiempos(tiemposDeManifiesto(null));
  const es = locale === "es";
  return (
    <ScrollView contentContainerStyle={[ui.screen, { backgroundColor: colors.bg }]}>
      <Text style={[ui.title, { color: colors.ink }]}>{es ? "Lectura" : "Reading"}</Text>
      <Text style={[ui.body, { color: colors.muted }]}>{capitulo?.aviso}</Text>
      <Pressable onPress={() => setSincronizada((valor) => !valor)} style={[ui.button, { backgroundColor: sincronizada ? colors.accent : colors.card }]}>
        <Text style={{ color: sincronizada ? colors.accentInk : colors.ink }}>{sincronizada ? (es ? "Con el audio" : "With audio") : (es ? "Solo lectura" : "Reading only")}</Text>
      </Pressable>
      {sincronizada && tiempos === "sin-tiempos" ? <Text style={[ui.body, { color: colors.muted }]}>{es ? "Sin tiempos por versículo en el manifiesto." : "No per-verse timings in the manifest."}</Text> : null}
      {capitulo?.versiculos.map((versiculo) => (
        <Text key={versiculo.versiculo} style={[ui.body, { color: colors.ink }]}>{versiculo.versiculo}. {versiculo.texto}</Text>
      ))}
    </ScrollView>
  );
}
