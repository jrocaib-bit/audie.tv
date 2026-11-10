import { eliminarCuenta } from "@audite/domain";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { supabaseApp } from "../auth";
import { fonts } from "../theme";

export default function EliminarCuenta() {
  const router = useRouter();
  const [confirmar, setConfirmar] = useState(false);
  const [aviso, setAviso] = useState("");

  async function borrar() {
    const remoto = supabaseApp();
    const resultado = await eliminarCuenta({
      rpc: async (nombre) => {
        if (!remoto) return { error: { message: "sin-config" } };
        const respuesta = await remoto.rpc(nombre);
        return { error: respuesta.error ? { message: respuesta.error.message } : null };
      },
      signOut: async () => {
        await remoto?.auth.signOut();
      },
    });
    if (resultado === "hecha") {
      router.replace("/");
      return;
    }
    setAviso("No se ha podido borrar.");
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#100E0C", paddingHorizontal: 22, paddingTop: 28 }}>
      <Pressable accessibilityRole="button" accessibilityLabel="Cerrar" onPress={() => router.back()} style={{ minHeight: 44, justifyContent: "center", alignSelf: "flex-start" }}>
        <Text style={{ color: "#F4ECE2", fontSize: 22 }}>↓</Text>
      </Pressable>
      <Text style={{ color: "#F4ECE2", fontFamily: fonts.serif, fontSize: 44, lineHeight: 48, marginTop: 16 }}>Eliminar cuenta</Text>
      <Text style={{ color: "#B7AB9C", fontSize: 16, lineHeight: 24, marginTop: 16 }}>Se borra la cuenta y los datos asociados. Esta acción no se deshace.</Text>
      {aviso ? <Text style={{ color: "#C9A96E", marginTop: 16 }}>{aviso}</Text> : null}
      {confirmar ? (
        <View style={{ marginTop: 28, gap: 12 }}>
          <Pressable accessibilityRole="button" onPress={() => void borrar()} style={{ minHeight: 52, borderRadius: 999, backgroundColor: "#C9A96E", alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: "#100E0C" }}>Sí, eliminar la cuenta</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => setConfirmar(false)} style={{ minHeight: 48, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: "#F4ECE2" }}>Cancelar</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable accessibilityRole="button" onPress={() => setConfirmar(true)} style={{ marginTop: 28, minHeight: 52, borderRadius: 999, borderWidth: 1, borderColor: "#2E2924", alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: "#F4ECE2" }}>Eliminar cuenta</Text>
        </Pressable>
      )}
    </View>
  );
}
