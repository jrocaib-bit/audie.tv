import { hrefDePasoAdviento, type Sesion } from "@audite/domain";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import retosJson from "../../../../content/tiempos/retos.json";
import { idiomaApp, textosAdviento } from "../adviento-textos";
import { sesionApp } from "../auth";
import { BucleCuadro } from "../bucle-cuadro";
import { bucleDe, medidasHueco } from "../bucles";
import { creditoObraReto } from "../credito-obra";
import { fonts } from "../theme";
import { useMobileLibrary } from "../state";

type Paso = { dia: number; episodio?: string; titulo: { es: string; en: string } };
type RetoJson = { id: string; titulo: { es: string; en: string }; pasos: Paso[] };

const RETO = (retosJson.retos as RetoJson[]).find((reto) => reto.id === "adviento-isaias");
const PASOS = RETO?.pasos ?? [];

export default function RetoAdviento() {
  const router = useRouter();
  const lang = idiomaApp(useMobileLibrary().settings.uiLocale);
  const textos = textosAdviento(lang);
  const ventana = useWindowDimensions();
  const hicks = bucleDe("reto:adviento-isaias:o1");
  const posterHicks = hicks?.poster ?? "";
  const caja = hicks && posterHicks ? medidasHueco(hicks.aspect, ventana.width, ventana.height) : null;
  const credito = caja ? creditoObraReto("reto-adviento_o1", lang) : "";
  const [sesion, setSesion] = useState<Sesion | null | undefined>(undefined);
  useEffect(() => {
    void sesionApp().then(setSesion);
  }, []);
  const conCuenta = Boolean(sesion);
  return (
    <ScrollView contentContainerStyle={{ padding: 22, paddingBottom: 48, gap: 12, backgroundColor: "#100E0C" }}>
      <Text style={{ color: "#F4ECE2", fontFamily: fonts.serif, fontSize: 36, lineHeight: 40 }}>{RETO?.titulo[lang] ?? ""}</Text>
      <Text style={{ color: "#B7AB9C" }}>{textos.gratis}</Text>
      {sesion === null ? (
        <Pressable accessibilityRole="button" onPress={() => router.push("/entrar")} style={{ minHeight: 52, borderRadius: 999, backgroundColor: "#C9A96E", alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: "#100E0C" }}>{textos.entrar}</Text>
        </Pressable>
      ) : null}
      {caja && hicks ? (
        <View style={{ alignSelf: "center", width: caja.width }}>
          <View style={{ width: caja.width, height: caja.height, overflow: "hidden", backgroundColor: "#100E0C" }}>
            <BucleCuadro bucle={hicks} poster={posterHicks} alt={credito || hicks.alt} />
          </View>
          {credito ? <Text style={{ color: "#B7AB9C", textAlign: "center", marginTop: 8, fontSize: 13 }}>{credito}</Text> : null}
        </View>
      ) : null}
      {PASOS.map((paso) => {
        const href = hrefDePasoAdviento(conCuenta, `/ahora?e=${paso.episodio ?? ""}`, "/entrar");
        return (
          <Pressable key={paso.dia} accessibilityRole="button" onPress={() => router.push(href as "/entrar" | "/ahora")} style={{ minHeight: 56, borderBottomWidth: 1, borderBottomColor: "#2E2924", justifyContent: "center" }}>
            <Text style={{ color: "#F4ECE2", fontFamily: fonts.serif, fontSize: 22 }}>{paso.dia}. {paso.titulo[lang]}</Text>
            <Text style={{ color: "#C9A96E", marginTop: 4 }}>{conCuenta ? textos.oir : textos.entra}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
