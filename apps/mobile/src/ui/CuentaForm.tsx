import { correoValido, plataformaCliente, textosAlta } from "@audite/domain";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Google from "expo-auth-session/providers/google";
import { useEffect, useState } from "react";
import { Platform, Pressable, Text, TextInput, View } from "react-native";
import { entrarApple, entrarCorreoApp, entrarGoogle } from "../auth";
import { medir } from "../medicion";
import { LogoApple, LogoGoogle } from "../marcas";
import { fonts } from "../theme";
import { dark } from "../theme";

const c = dark;
const boton = { height: 52, borderRadius: 14, backgroundColor: "#fff", alignItems: "center" as const, justifyContent: "center" as const, flexDirection: "row" as const, gap: 10 };

/** Proveedores existentes de /entrar: Apple, Google y enlace por correo. Sin cambios de auth. */
export function CuentaForm({ lang, ubicacion }: { lang: "es" | "en"; ubicacion: string }) {
  const plataforma = plataformaCliente(Platform.OS);
  const copy = textosAlta(lang);
  const [correo, setCorreo] = useState("");
  const [estado, setEstado] = useState("");
  const ios = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim() ?? "";
  const web = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID?.trim() ?? "";
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

  const base = { form_id: "alta_entrar", ubicacion, idioma: lang, plataforma, opt_in_correo: false } as const;
  return (
    <View style={{ gap: 12 }}>
      {Platform.OS === "ios" ? (
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
          cornerRadius={14}
          style={{ width: "100%", height: 52 }}
          onPress={() => {
            medir("cta_clicked", { ...base, cta_id: "alta_apple", metodo: "apple" });
            void entrarApple().then(() => setEstado(copy.listo)).catch(() => setEstado(""));
          }}
        />
      ) : (
        <Pressable accessibilityRole="button" accessibilityLabel={copy.apple} onPress={() => void entrarApple().catch(() => setEstado(""))} style={boton}>
          <LogoApple />
          <Text style={{ color: "#000", fontSize: 17, fontWeight: "600" }}>{copy.apple}</Text>
        </Pressable>
      )}
      {process.env.EXPO_PUBLIC_GOOGLE_LOGIN_ENABLED === "true" ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copy.google}
          onPress={() => {
            if (!ios && !web) return;
            medir("cta_clicked", { ...base, cta_id: "alta_google", metodo: "google" });
            void pedirGoogle();
          }}
          style={[boton, { borderWidth: 1, borderColor: "#747775" }]}
        >
          <LogoGoogle />
          <Text style={{ color: "#1F1F1F", fontSize: 17, fontWeight: "500" }}>{copy.google}</Text>
        </Pressable>
      ) : null}
      <View style={{ flexDirection: "row", gap: 8 }}>
        <TextInput
          value={correo}
          onChangeText={setCorreo}
          autoCapitalize="none"
          keyboardType="email-address"
          accessibilityLabel={copy.correo}
          placeholder={copy.correo}
          placeholderTextColor={c.muted}
          style={{ flex: 1, height: 52, borderRadius: 14, borderWidth: 1, borderColor: "rgba(244,236,226,0.3)", color: c.ink, paddingHorizontal: 16, fontFamily: fonts.sans, fontSize: 16 }}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copy.enviar}
          onPress={() => {
            if (!correoValido(correo)) return;
            medir("cta_clicked", { ...base, cta_id: "alta_magic_link", metodo: "correo" });
            medir("form_submitted", { ...base, cta_id: "alta_magic_link", metodo: "correo" });
            void entrarCorreoApp(correo).then(() => setEstado(copy.listo)).catch(() => setEstado(""));
          }}
          style={{ height: 52, paddingHorizontal: 18, borderRadius: 14, backgroundColor: c.accent, alignItems: "center", justifyContent: "center" }}
        >
          <Text style={{ color: c.accentInk, fontFamily: fonts.medium, fontSize: 16, fontWeight: "600" }}>{copy.enviar}</Text>
        </Pressable>
      </View>
      {estado ? <Text style={{ color: c.accent, textAlign: "center", fontFamily: fonts.medium }}>{estado}</Text> : null}
    </View>
  );
}
