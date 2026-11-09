import { etiquetaCita, referenciasDe, type ReferenciaCruzada } from "@audite/domain";
import dataset from "../../../../content/referencias/openbible.json";
import { ScrollView, Text } from "react-native";
import { useMobileLibrary } from "../state";
import { dark, light, ui } from "../theme";

const lista = (dataset as { refs: ReferenciaCruzada[]; atribucion: string }).refs;
const atribucion = (dataset as { atribucion: string }).atribucion;

export default function Referencias() {
  const library = useMobileLibrary();
  const colors = library.settings.theme === "light" ? light : dark;
  const es = library.settings.uiLocale === "es";
  const relacionadas = referenciasDe(lista, { libroId: "gn", capitulo: 1, versiculo: 1 });
  return (
    <ScrollView contentContainerStyle={[ui.screen, { backgroundColor: colors.bg }]}>
      <Text style={[ui.title, { color: colors.ink }]}>{es ? "Al margen" : "Margin"}</Text>
      <Text style={[ui.body, { color: colors.muted }]}>{atribucion}</Text>
      {relacionadas.map((referencia) => (
        <Text key={referencia.orden} style={[ui.body, { color: colors.ink, fontFamily: "Georgia" }]}>
          {etiquetaCita(referencia.hacia, referencia.hacia.libroId)}
        </Text>
      ))}
    </ScrollView>
  );
}
