import { alternarDiaReto, hrefDePasoAdviento, leerProgresoRetos, localIsoDate, type ProgresoReto, type Sesion } from "@audite/domain";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import retosJson from "../../../../content/tiempos/retos.json";
import { sesionApp } from "../auth";
import { medir } from "../medicion";
import { BucleCuadro } from "../bucle-cuadro";
import { bucleDe, medidasHueco } from "../bucles";
import { creditoObraReto } from "../credito-obra";
import { fonts } from "../theme";

const RETO_ID = "adviento-isaias";
const CLAVE_RETOS = "audite.retos.v1";
const PASOS = retosJson.retos.find((reto) => reto.id === "adviento-isaias")?.pasos ?? [];

export default function RetoAdviento() {
  const router = useRouter();
  const ventana = useWindowDimensions();
  const hicks = bucleDe("reto:adviento-isaias:o1");
  const posterHicks = hicks?.poster ?? "";
  const caja = hicks && posterHicks ? medidasHueco(hicks.aspect, ventana.width, ventana.height) : null;
  const credito = caja ? creditoObraReto("reto-adviento_o1", "es") : "";
  const [sesion, setSesion] = useState<Sesion | null | undefined>(undefined);
  useEffect(() => {
    void sesionApp().then(setSesion);
  }, []);
  const conCuenta = Boolean(sesion);
  useEffect(() => {
    if (conCuenta) medir("challenge_started", { reto_id: "adviento-isaias" });
  }, [conCuenta]);
  const [hechos, setHechos] = useState<number[]>([]);
  useEffect(() => {
    void AsyncStorage.getItem(CLAVE_RETOS).then((raw) => setHechos(leerProgresoRetos(raw)[RETO_ID]?.hechos ?? [])).catch(() => undefined);
  }, []);
  const marcar = async (dia: number, episodio: string) => {
    let guardado: Record<string, ProgresoReto> = {};
    try {
      guardado = leerProgresoRetos(await AsyncStorage.getItem(CLAVE_RETOS));
    } catch {
      // Sin lectura: se parte del estado en pantalla.
    }
    const r = alternarDiaReto(guardado[RETO_ID] ?? { hechos, fechas: [] }, dia, PASOS.length, localIsoDate(new Date()));
    setHechos(r.progreso.hechos);
    try {
      await AsyncStorage.setItem(CLAVE_RETOS, JSON.stringify({ ...guardado, [RETO_ID]: r.progreso }));
    } catch {
      // El día queda marcado en memoria aunque no se pueda escribir.
    }
    if (!r.nuevo) return;
    medir("challenge_day_completed", { reto_id: RETO_ID, dia, episode_id: episodio });
    if (r.completado) medir("challenge_completed", { reto_id: RETO_ID });
  };
  const es = true;
  return (
    <ScrollView contentContainerStyle={{ padding: 22, paddingBottom: 48, gap: 12, backgroundColor: "#100E0C" }}>
      <Text style={{ color: "#F4ECE2", fontFamily: fonts.serif, fontSize: 36, lineHeight: 40 }}>Adviento con Isaías</Text>
      <Text style={{ color: "#B7AB9C" }}>{es ? "Es gratis. Hace falta una cuenta: regístrate o inicia sesión. No se pide suscripción ni prueba." : "It is free. You need an account: sign up or sign in. There is no subscription and no trial."}</Text>
      {sesion === null ? (
        <Pressable accessibilityRole="button" onPress={() => router.push("/entrar")} style={{ minHeight: 52, borderRadius: 999, backgroundColor: "#C9A96E", alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: "#100E0C" }}>Regístrate o inicia sesión</Text>
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
          <View key={paso.dia} style={{ flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: "#2E2924" }}>
            <Pressable accessibilityRole="button" onPress={() => router.push(href as "/entrar" | "/ahora")} style={{ flex: 1, minHeight: 56, justifyContent: "center" }}>
              <Text style={{ color: "#F4ECE2", fontFamily: fonts.serif, fontSize: 22 }}>{paso.dia}. {paso.titulo.es}</Text>
              <Text style={{ color: "#C9A96E", marginTop: 4 }}>{conCuenta ? "Oír" : "Entra para oír"}</Text>
            </Pressable>
            {conCuenta ? (
              <Pressable accessibilityRole="button" accessibilityLabel={hechos.includes(paso.dia) ? "Hecho" : "Marcar"} onPress={() => void marcar(paso.dia, paso.episodio ?? "")} style={{ width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: "#2E2924", alignItems: "center", justifyContent: "center", backgroundColor: hechos.includes(paso.dia) ? "#C9A96E" : "transparent" }}>
                <Text style={{ color: "#100E0C" }}>{hechos.includes(paso.dia) ? "✓" : ""}</Text>
              </Pressable>
            ) : null}
          </View>
        );
      })}
    </ScrollView>
  );
}
