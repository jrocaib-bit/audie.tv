import { useRouter } from "expo-router";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { tx } from "../textos";
import { CaminoCard } from "../ui/CaminoCard";
import { Entrada } from "../ui/Entrada";
import { ScreenHeader } from "../ui/ScreenHeader";
import { haptico, useTema } from "../ui/tema";
import { useCaminos } from "../ui/useCaminos";

export default function Caminos() {
  const { c, lang, library } = useTema();
  const t = tx(lang);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const caminos = useCaminos();
  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bg }} contentContainerStyle={{ paddingBottom: 32 + insets.bottom }} showsVerticalScrollIndicator={false}>
      <ScreenHeader c={c} titulo={t.tabCaminos} />
      <View style={{ paddingHorizontal: 20, gap: 14, paddingTop: 8 }}>
        {caminos.map((camino, i) => (
          <Entrada key={camino.def.id} orden={i}>
            <CaminoCard
              c={c}
              principal={camino.def.id === "biblia"}
              nombre={camino.nombre}
              src={camino.src}
              hechos={camino.progreso.hechos}
              total={camino.progreso.total}
              fraccion={camino.progreso.fraccion}
              de={t.de}
              accion={camino.progreso.hechos > 0 ? t.continuar : t.empezar}
              activo={camino.activo}
              etiquetaActivo={t.activo}
              onPress={() => {
                if (camino.activo) {
                  haptico();
                  router.navigate("/");
                  return;
                }
                library.updateSettings({ caminoActivo: camino.def.id });
              }}
            />
          </Entrada>
        ))}
      </View>
    </ScrollView>
  );
}
