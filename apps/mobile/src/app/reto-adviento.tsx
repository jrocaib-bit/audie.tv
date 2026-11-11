import { hrefDePasoAdviento, type Sesion } from "@audite/domain";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import retosJson from "../../../../content/tiempos/retos.json";
import { sesionApp } from "../auth";
import { fonts } from "../theme";

const PASOS = retosJson.retos.find((reto) => reto.id === "adviento-isaias")?.pasos ?? [];

export default function RetoAdviento() {
  const router = useRouter();
  const [sesion, setSesion] = useState<Sesion | null | undefined>(undefined);
  useEffect(() => {
    void sesionApp().then(setSesion);
  }, []);
  const conCuenta = Boolean(sesion);
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
      {PASOS.map((paso) => {
        const href = hrefDePasoAdviento(conCuenta, `/ahora?e=${paso.episodio ?? ""}`, "/entrar");
        return (
          <Pressable key={paso.dia} accessibilityRole="button" onPress={() => router.push(href as "/entrar" | "/ahora")} style={{ minHeight: 56, borderBottomWidth: 1, borderBottomColor: "#2E2924", justifyContent: "center" }}>
            <Text style={{ color: "#F4ECE2", fontFamily: fonts.serif, fontSize: 22 }}>{paso.dia}. {paso.titulo.es}</Text>
            <Text style={{ color: "#C9A96E", marginTop: 4 }}>{conCuenta ? "Oír" : "Entra para oír"}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
