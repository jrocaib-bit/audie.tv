import { correoValido, textosAlta } from "@audite/domain";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Google from "expo-auth-session/providers/google";
import * as Linking from "expo-linking";
import { useEffect, useState } from "react";
import { Image, Platform, Pressable, Text, TextInput, View } from "react-native";
import { entrarApple, entrarCorreoApp, entrarGoogle } from "../auth";
import { LogoApple, LogoGoogle } from "../marcas";
import { useMobileLibrary } from "../state";
import { fonts } from "../theme";

const noche = "#100E0C";
const crema = "#F4ECE2";
const oro = "#C9A96E";
const obra = `${process.env.EXPO_PUBLIC_CONTENT_BASE ?? "http://127.0.0.1:43123"}/obras/gn-01_o5-detalle-960.webp`;

const boton = {
  height: 48,
  borderRadius: 6,
  backgroundColor: "#fff",
  alignItems: "center" as const,
  justifyContent: "center" as const,
  flexDirection: "row" as const,
  gap: 10,
};

export default function EntrarScreen() {
  const copy = textosAlta(useMobileLibrary().settings.uiLocale);
  const [correo, setCorreo] = useState("");
  const [estado, setEstado] = useState("");
  const ios = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim() ?? "";
  const web = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID?.trim() ?? "";
  const googleListo = Boolean(ios || web);
  const [, respuesta, pedirGoogle] = Google.useIdTokenAuthRequest({
    iosClientId: ios || undefined,
    // El hook de Google exige un client id aunque las variables estén vacías. No es una credencial.
    clientId: web || "000000000000-audite.apps.googleusercontent.com",
    webClientId: web || "000000000000-audite.apps.googleusercontent.com",
  });

  useEffect(() => {
    const token = respuesta?.type === "success" ? respuesta.params.id_token : "";
    if (!token) return;
    void entrarGoogle(token).then(() => setEstado(copy.listo)).catch(() => setEstado(""));
  }, [respuesta, copy.listo]);

  return (
    <View style={{ flex: 1, backgroundColor: noche }}>
      <Image source={{ uri: obra }} style={{ position: "absolute", top: 0, left: 0, right: 0, height: 420 }} />
      <View style={{ position: "absolute", top: 0, left: 0, right: 0, height: 420, backgroundColor: "rgba(16,14,12,0.35)" }} />
      <View style={{ position: "absolute", top: 240, left: 0, right: 0, height: 80, backgroundColor: "rgba(16,14,12,0.45)" }} />
      <View style={{ position: "absolute", top: 310, left: 0, right: 0, height: 110, backgroundColor: "rgba(16,14,12,0.82)" }} />
      <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 64, paddingBottom: 28, justifyContent: "space-between" }}>
        <View>
          <Image source={require("../../assets/marca/audite_wordmark_blanco.png")} style={{ height: 32, width: 148 }} resizeMode="contain" />
          <Text style={{ color: crema, fontFamily: fonts.serif, fontSize: 48, lineHeight: 52, marginTop: 28 }}>{copy.titulo}</Text>
        </View>
        <View style={{ gap: 12 }}>
          {Platform.OS === "ios" ? (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
              cornerRadius={6}
              style={{ width: "100%", height: 48 }}
              onPress={() => void entrarApple().then(() => setEstado(copy.listo)).catch(() => setEstado(""))}
            />
          ) : (
            <Pressable accessibilityRole="button" onPress={() => void entrarApple().catch(() => setEstado(""))} style={boton}>
              <LogoApple />
              <Text style={{ color: "#000", fontSize: 17, fontWeight: "600" }}>{copy.apple}</Text>
            </Pressable>
          )}
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              if (!googleListo) return;
              void pedirGoogle();
            }}
            style={[boton, { borderWidth: 1, borderColor: "#747775" }]}
          >
            <LogoGoogle />
            <Text style={{ color: "#1F1F1F", fontSize: 17, fontWeight: "500" }}>{copy.google}</Text>
          </Pressable>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: "rgba(244,236,226,0.25)" }} />
            <Text style={{ color: "#B7AB9C" }}>{copy.o}</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: "rgba(244,236,226,0.25)" }} />
          </View>
          <TextInput
            value={correo}
            onChangeText={setCorreo}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder={copy.correo}
            placeholderTextColor="#B7AB9C"
            style={{ height: 48, borderRadius: 6, borderWidth: 1, borderColor: "rgba(244,236,226,0.3)", color: crema, paddingHorizontal: 16 }}
          />
          <Pressable
            onPress={() => {
              if (!correoValido(correo)) return;
              void entrarCorreoApp(correo).then(() => setEstado(copy.listo)).catch(() => setEstado(""));
            }}
            style={{ height: 48, borderRadius: 6, borderWidth: 1, borderColor: "rgba(244,236,226,0.4)", alignItems: "center", justifyContent: "center" }}
          >
            <Text style={{ color: crema, fontSize: 17 }}>{copy.enviar}</Text>
          </Pressable>
          {estado ? <Text style={{ color: oro, textAlign: "center" }}>{estado}</Text> : null}
          <View style={{ flexDirection: "row", justifyContent: "center", gap: 20 }}>
            <Text style={{ color: "#B7AB9C", minHeight: 44, lineHeight: 44 }} onPress={() => void Linking.openURL("https://audite.tv/es/condiciones")}>{copy.condiciones}</Text>
            <Text style={{ color: "#B7AB9C", minHeight: 44, lineHeight: 44 }} onPress={() => void Linking.openURL("https://audite.tv/es/privacidad")}>{copy.privacidad}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
