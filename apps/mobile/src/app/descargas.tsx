import { espacioUsado, idsDeAlcance, planificar, puedeBajar, textoEspacio, type AlcanceDescarga, type ArchivoLocal, type EpisodioDescargable, type Red } from "@audite/domain";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { bajarEpisodio, borrarEpisodio, leerDescargas } from "../descargas";
import { useMobileLibrary } from "../state";
import { dark, light, ui } from "../theme";

export default function Descargas() {
  const library = useMobileLibrary();
  const locale = library.settings.uiLocale;
  const colors = library.settings.theme === "light" ? light : dark;
  const [soloWifi, setSoloWifi] = useState(true);
  const [red, setRed] = useState<Red>("wifi");
  const [archivos, setArchivos] = useState<ArchivoLocal[]>([]);
  const [aviso, setAviso] = useState("");
  const [alcance, setAlcance] = useState<AlcanceDescarga>("episodio");
  const es = locale === "es";
  const episodios: EpisodioDescargable[] = library.catalog.episodes.map((episodio) => ({
    id: episodio.id,
    bookId: episodio.bookId,
    titulo: episodio.title,
    bytes: episodio.segments.reduce((suma, segmento) => suma + segmento.bytes, 0),
    remoto: episodio.segments[0]?.publicPath ?? "",
  }));
  const ids = idsDeAlcance(alcance, episodios, {
    episodioId: episodios[0]?.id,
    bookId: episodios[0]?.bookId ?? "gn",
    camino: library.path.steps.map((paso) => paso.episodeId),
    oidos: new Set(Object.keys(library.progress.episodes)),
  });
  const plan = planificar(ids, archivos);

  async function pedir() {
    const motivo = puedeBajar(soloWifi, red);
    if (motivo !== "listo") {
      setAviso(motivo === "sin-red" ? (es ? "No hay red." : "There is no network.") : (es ? "Solo Wi-Fi. Con datos no se baja." : "Wi-Fi only. Cellular will not download."));
      return;
    }
    const base = process.env.EXPO_PUBLIC_CONTENT_BASE ?? "http://127.0.0.1:43123";
    for (const id of plan.nuevos) {
      const episodio = library.catalog.episodes.find((item) => item.id === id);
      if (!episodio) continue;
      await bajarEpisodio(id, episodio.segments.map((segmento) => ({ id: segmento.id, url: `${base}${segmento.publicPath}` })));
    }
    setArchivos(await leerDescargas());
    setAviso(es ? "Guardado en el dispositivo. El reproductor usa el archivo local." : "Kept on the device. The player uses the local file.");
  }

  return (
    <ScrollView contentContainerStyle={[ui.screen, { backgroundColor: colors.bg }]}>
      <Text style={[ui.title, { color: colors.ink }]}>{es ? "Descargas" : "Downloads"}</Text>
      <Text style={[ui.body, { color: colors.muted }]}>{es ? "El audio queda en este aparato. Se puede borrar. Con solo Wi-Fi no usa datos." : "Audio stays on this device. It can be deleted. Wi-Fi only skips cellular."}</Text>
      <Pressable onPress={() => setSoloWifi((valor) => !valor)} style={[ui.button, { backgroundColor: soloWifi ? colors.accent : colors.card }]}>
        <Text style={{ color: soloWifi ? colors.accentInk : colors.ink }}>{es ? "Solo Wi-Fi" : "Wi-Fi only"}: {soloWifi ? (es ? "sí" : "on") : (es ? "no" : "off")}</Text>
      </Pressable>
      <View style={ui.row}>
        {(["wifi", "celular", "sin-red"] as const).map((opcion) => (
          <Pressable key={opcion} onPress={() => setRed(opcion)} style={[ui.button, { backgroundColor: red === opcion ? colors.accent : colors.card }]}>
            <Text style={{ color: red === opcion ? colors.accentInk : colors.ink }}>{opcion}</Text>
          </Pressable>
        ))}
      </View>
      <View style={ui.row}>
        {(["episodio", "libro", "semana"] as const).map((opcion) => (
          <Pressable key={opcion} onPress={() => setAlcance(opcion)} style={[ui.button, { backgroundColor: alcance === opcion ? colors.accent : colors.card }]}>
            <Text style={{ color: alcance === opcion ? colors.accentInk : colors.ink }}>{opcion}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={[ui.body, { color: colors.ink }]}>{plan.nuevos.join(", ") || (es ? "Nada con máster" : "No master")}</Text>
      <Pressable onPress={() => void pedir()} style={[ui.button, { backgroundColor: colors.accent }]}>
        <Text style={{ color: colors.accentInk }}>{es ? "Bajar" : "Download"}</Text>
      </Pressable>
      {aviso ? <Text style={[ui.body, { color: colors.ink }]}>{aviso}</Text> : null}
      <Text style={[ui.title, { color: colors.ink, fontSize: 28 }]}>{textoEspacio(espacioUsado(archivos), locale)}</Text>
      {archivos.map((archivo) => (
        <Pressable key={archivo.episodeId} onPress={() => void borrarEpisodio(archivo.episodeId).then(setArchivos)} style={[ui.button, { backgroundColor: colors.card }]}>
          <Text style={{ color: colors.ink }}>{es ? "Borrar" : "Delete"} {archivo.episodeId}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}
