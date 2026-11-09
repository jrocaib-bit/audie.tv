import { agregarNota, alternarFavorito, esFavorito, marcadoresVacios, type Marcadores } from "@audite/domain";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput } from "react-native";
import { useMobileLibrary } from "../state";
import { dark, light, ui } from "../theme";

const CLAVE = "audite.marcadores.v1";

export default function Notas() {
  const library = useMobileLibrary();
  const locale = library.settings.uiLocale;
  const colors = library.settings.theme === "light" ? light : dark;
  const [datos, setDatos] = useState<Marcadores>(marcadoresVacios);
  const [texto, setTexto] = useState("");
  const episodio = library.catalog.episodes[0]?.id ?? "gn-01";
  const es = locale === "es";

  async function guardar(siguiente: Marcadores) {
    setDatos(siguiente);
    await AsyncStorage.setItem(CLAVE, JSON.stringify(siguiente));
  }

  return (
    <ScrollView contentContainerStyle={[ui.screen, { backgroundColor: colors.bg }]}>
      <Text style={[ui.title, { color: colors.ink }]}>{es ? "Notas" : "Notes"}</Text>
      <Text style={[ui.body, { color: colors.muted }]}>{es ? "Solo en este aparato." : "Only on this device."}</Text>
      <Pressable onPress={() => void guardar(alternarFavorito(datos, episodio, new Date().toISOString()))} style={[ui.button, { backgroundColor: esFavorito(datos, episodio) ? colors.accent : colors.card }]}>
        <Text style={{ color: esFavorito(datos, episodio) ? colors.accentInk : colors.ink }}>{es ? "Favorito" : "Favorite"} {episodio}</Text>
      </Pressable>
      <TextInput value={texto} onChangeText={setTexto} placeholder={es ? "Nota del versículo" : "Verse note"} placeholderTextColor={colors.muted} style={{ minHeight: 48, color: colors.ink, borderWidth: 1, borderColor: colors.line, borderRadius: 16, padding: 12 }} />
      <Pressable
        onPress={() => {
          const siguiente = agregarNota(datos, { episodeId: episodio, versiculo: "1:1", texto, segundo: library.globalTime }, new Date().toISOString());
          if (siguiente) void guardar(siguiente);
          setTexto("");
        }}
        style={[ui.button, { backgroundColor: colors.accent }]}
      >
        <Text style={{ color: colors.accentInk }}>{es ? "Guardar en este punto" : "Save at this point"}</Text>
      </Pressable>
      {datos.notas.map((nota) => (
        <Text key={nota.id} style={[ui.body, { color: colors.ink }]}>{nota.versiculo}: {nota.texto}{nota.segundo == null ? "" : ` · ${Math.floor(nota.segundo)}s`}</Text>
      ))}
    </ScrollView>
  );
}
