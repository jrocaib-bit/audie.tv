import { correoValido } from "@audite/domain";
import * as Google from "expo-auth-session/providers/google";
import { useEffect, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { borrarApp, cerrarApp, entrarApple, entrarCorreoApp, entrarGoogle } from "../auth";

const noche = "#100E0C";
const crema = "#F4ECE2";
const oro = "#C9A96E";

export default function EntrarScreen() {
  const [correo, setCorreo] = useState("");
  const [estado, setEstado] = useState("");
  const ios = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || undefined;
  const web = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || undefined;
  const [, respuesta, pedirGoogle] = Google.useIdTokenAuthRequest({ iosClientId: ios, clientId: web });

  useEffect(() => {
    const token = respuesta?.type === "success" ? respuesta.params.id_token : "";
    if (!token) return;
    void entrarGoogle(token).then(() => setEstado("Listo")).catch(() => setEstado(""));
  }, [respuesta]);

  return (
    <View style={{ flex: 1, backgroundColor: noche, padding: 24, justifyContent: "center" }}>
      <Text style={{ color: oro, letterSpacing: 2, textTransform: "uppercase" }}>Audite</Text>
      <Text style={{ color: crema, fontSize: 48, marginTop: 12 }}>Entrar</Text>
      <View style={{ flexDirection: "row", gap: 12, marginTop: 28 }}>
        <Pressable
          accessibilityRole="button"
          onPress={() => void entrarApple().then(() => setEstado("Listo")).catch(() => setEstado(""))}
          style={{ flex: 1, minHeight: 56, borderRadius: 999, backgroundColor: crema, alignItems: "center", justifyContent: "center" }}
        >
          <Text style={{ color: noche }}>Apple</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            if (!ios && !web) return;
            void pedirGoogle();
          }}
          style={{ flex: 1, minHeight: 56, borderRadius: 999, backgroundColor: crema, alignItems: "center", justifyContent: "center" }}
        >
          <Text style={{ color: noche }}>Google</Text>
        </Pressable>
      </View>
      <TextInput
        value={correo}
        onChangeText={setCorreo}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="Correo"
        placeholderTextColor="#B7AB9C"
        style={{ minHeight: 48, marginTop: 20, borderRadius: 999, borderWidth: 1, borderColor: "rgba(244,236,226,0.3)", color: crema, paddingHorizontal: 16 }}
      />
      <Pressable
        onPress={() => {
          if (!correoValido(correo)) return;
          void entrarCorreoApp(correo).then(() => setEstado("Listo")).catch(() => setEstado(""));
        }}
        style={{ minHeight: 48, marginTop: 12, borderRadius: 999, borderWidth: 1, borderColor: "rgba(244,236,226,0.4)", alignItems: "center", justifyContent: "center" }}
      >
        <Text style={{ color: crema }}>Enviar enlace</Text>
      </Pressable>
      <View style={{ flexDirection: "row", gap: 16, marginTop: 28 }}>
        <Pressable onPress={() => void cerrarApp()} style={{ minHeight: 44, justifyContent: "center" }}><Text style={{ color: crema }}>Salir</Text></Pressable>
        <Pressable onPress={() => void borrarApp()} style={{ minHeight: 44, justifyContent: "center" }}><Text style={{ color: crema }}>Borrar cuenta</Text></Pressable>
      </View>
      {estado ? <Text style={{ color: oro, marginTop: 16 }}>{estado}</Text> : null}
    </View>
  );
}
