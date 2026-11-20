import { hrefDePasoAdviento, type Sesion } from "@audite/domain";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import retosJson from "../../../../content/tiempos/retos.json";
import { sesionApp } from "../auth";
import { BucleCuadro } from "../bucle-cuadro";
import { bucleDe, medidasHueco } from "../bucles";
import { fonts } from "../theme";
import { tx } from "../textos";
import { Boton } from "../ui/Basicos";
import { Entrada } from "../ui/Entrada";
import { Icono } from "../ui/Icono";
import { ObraMarco } from "../ui/ObraMarco";
import { Pulsable } from "../ui/Pulsable";
import { Ring } from "../ui/Ring";
import { useTema } from "../ui/tema";

type Paso = { dia: number; episodio?: string; titulo: { es: string; en: string } };
type RetoJson = { id: string; titulo: { es: string; en: string }; pasos: Paso[] };

const RETO = (retosJson.retos as RetoJson[]).find((reto) => reto.id === "adviento-isaias");
const PASOS = RETO?.pasos ?? [];
const PORTADA = "/obras/reto-adviento_o2-1x1.webp";

export default function RetoAdviento() {
  const { c, lang, library } = useTema();
  const t = tx(lang);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const ventana = useWindowDimensions();
  const hicks = bucleDe("reto:adviento-isaias:o1");
  const posterHicks = hicks?.poster ?? "";
  const caja = hicks && posterHicks ? medidasHueco(hicks.aspect, ventana.width - 40, ventana.height * 0.4) : null;
  const [sesion, setSesion] = useState<Sesion | null | undefined>(undefined);
  useEffect(() => {
    void sesionApp().then(setSesion);
  }, []);
  const conCuenta = Boolean(sesion);
  const grabados = new Set(library.catalog.episodes.map((e) => e.id));
  const hechos = PASOS.filter((p) => p.episodio && library.progress.episodes[p.episodio]?.completed).length;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bg }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 + insets.bottom, gap: 20 }} showsVerticalScrollIndicator={false}>
      <Entrada style={{ gap: 16 }}>
        <Text accessibilityRole="header" style={{ color: c.ink, fontFamily: fonts.serif, fontSize: 36, lineHeight: 40 }}>{RETO?.titulo[lang] ?? t.adviento}</Text>
        {caja && hicks ? (
          <View style={{ alignSelf: "center", width: caja.width, height: caja.height, borderRadius: 24, overflow: "hidden" }}>
            <BucleCuadro bucle={hicks} poster={posterHicks} alt={hicks.alt} />
          </View>
        ) : (
          <ObraMarco src={PORTADA} style={{ height: 240, borderRadius: 24 }} />
        )}
      </Entrada>

      <Entrada orden={1} style={{ flexDirection: "row", alignItems: "center", gap: 20, padding: 20, borderRadius: 24, backgroundColor: c.card, borderWidth: 1, borderColor: c.line }}>
        <Ring fraccion={PASOS.length ? hechos / PASOS.length : 0} size={104} trazo={9} color={c.accent} pista={c.line}>
          <Text style={{ color: c.ink, fontFamily: fonts.serif, fontSize: 34 }}>{hechos}</Text>
        </Ring>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={{ color: c.ink, fontFamily: fonts.serif, fontSize: 30 }}>{hechos} {t.de} {PASOS.length}</Text>
          <Text style={{ color: c.muted, fontFamily: fonts.sans, fontSize: 15 }}>{t.dias}</Text>
        </View>
      </Entrada>

      {sesion === null ? <Boton c={c} texto={t.entrarParaEscuchar} onPress={() => router.push("/entrar")} /> : null}

      <View style={{ gap: 8 }}>
        {PASOS.map((paso, i) => {
          const grabado = Boolean(paso.episodio && grabados.has(paso.episodio));
          const hecho = Boolean(paso.episodio && library.progress.episodes[paso.episodio]?.completed);
          const href = hrefDePasoAdviento(conCuenta, `/ahora?e=${paso.episodio ?? ""}`, "/entrar");
          return (
            <Entrada key={paso.dia} orden={Math.min(i, 6) + 2}>
              <Pulsable onPress={grabado ? () => router.push(href as "/entrar" | "/ahora") : undefined} disabled={!grabado} label={`${t.dia} ${paso.dia}. ${paso.titulo[lang]}`} escala={0.985} style={{ minHeight: 64, paddingHorizontal: 14, borderRadius: 20, flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: c.card, borderWidth: 1, borderColor: c.line, opacity: grabado ? 1 : 0.7 }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: hecho ? c.accent : "transparent", borderWidth: hecho ? 0 : 1, borderColor: c.line }}>
                  {hecho ? <Icono nombre="check" size={18} color={c.accentInk} trazo={2.4} /> : <Text style={{ color: c.ink, fontFamily: fonts.medium, fontSize: 15 }}>{paso.dia}</Text>}
                </View>
                <Text numberOfLines={2} style={{ flex: 1, color: c.ink, fontFamily: fonts.serif, fontSize: 20, lineHeight: 24 }}>{paso.titulo[lang]}</Text>
                {grabado ? (
                  <Icono nombre={conCuenta ? "play" : "candado"} size={conCuenta ? 18 : 20} color={conCuenta ? c.accent : c.muted} />
                ) : (
                  <Text style={{ color: c.muted, fontFamily: fonts.medium, fontSize: 12 }}>{t.proximamente}</Text>
                )}
              </Pulsable>
            </Entrada>
          );
        })}
      </View>
    </ScrollView>
  );
}
