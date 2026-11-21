import { correoValido, plataformaCliente, textosAlta } from "@audite/domain";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Google from "expo-auth-session/providers/google";
import { useEffect, useState } from "react";
import { Platform, Pressable, Text, TextInput, View } from "react-native";
import { confirmarCodigoApp, entrarApple, entrarCorreoApp, entrarGoogle } from "../auth";
import { medir } from "../medicion";
import { LogoApple, LogoGoogle } from "../marcas";
import { fonts } from "../theme";
import { dark } from "../theme";
import { propsCampoCodigo, propsCampoCorreo } from "./campo-correo";

const c = dark;
const boton = { height: 52, borderRadius: 14, backgroundColor: "#fff", alignItems: "center" as const, justifyContent: "center" as const, flexDirection: "row" as const, gap: 10 };

/** Proveedores existentes de /entrar: Apple, Google y enlace por correo. Sin cambios de auth. */
export function CuentaForm({ lang, ubicacion }: { lang: "es" | "en"; ubicacion: string }) {
  const plataforma = plataformaCliente(Platform.OS);
  const copy = textosAlta(lang);
  const [correo, setCorreo] = useState("");
  const [codigo, setCodigo] = useState("");
  const [estado, setEstado] = useState("");
  const [esperandoCodigo, setEsperandoCodigo] = useState(false);
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
  const enviar = () => {
    if (!correoValido(correo)) return;
    medir("cta_clicked", { ...base, cta_id: "alta_magic_link", metodo: "correo" });
    medir("form_submitted", { ...base, cta_id: "alta_magic_link", metodo: "correo" });
    void entrarCorreoApp(correo)
      .then(() => {
        setEsperandoCodigo(true);
        setEstado(copy.codigoAyuda);
      })
      .catch(() => setEstado(""));
  };
  const confirmarCodigo = (valor = codigo) => {
    const limpio = valor.replace(/\D/g, "").slice(0, 6);
    if (limpio.length !== 6) return;
    void confirmarCodigoApp(correo, limpio)
      .then(() => setEstado(copy.listo))
      .catch(() => setEstado(copy.codigoError));
  };
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
      <View style={{ gap: 10 }}>
        <TextInput
          value={correo}
          onChangeText={setCorreo}
          {...propsCampoCorreo}
          returnKeyType="send"
          enablesReturnKeyAutomatically
          blurOnSubmit
          onSubmitEditing={enviar}
          accessibilityLabel={copy.correo}
          placeholder={copy.correo}
          placeholderTextColor={c.muted}
          style={{ height: 52, borderRadius: 14, borderWidth: 1, borderColor: "rgba(244,236,226,0.3)", color: c.ink, paddingHorizontal: 16, fontFamily: fonts.sans, fontSize: 16 }}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copy.enviar}
          onPress={enviar}
          style={{ height: 52, borderRadius: 14, backgroundColor: c.accent, alignItems: "center", justifyContent: "center" }}
        >
          <Text style={{ color: c.accentInk, fontFamily: fonts.medium, fontSize: 16, fontWeight: "600" }}>{copy.enviar}</Text>
        </Pressable>
      </View>
      {esperandoCodigo ? (
        <View style={{ gap: 10 }}>
          <TextInput
            value={codigo}
            onChangeText={(valor) => {
              const limpio = valor.replace(/\D/g, "").slice(0, 6);
              setCodigo(limpio);
              if (limpio.length === 6) confirmarCodigo(limpio);
            }}
            {...propsCampoCodigo}
            returnKeyType="done"
            enablesReturnKeyAutomatically
            blurOnSubmit
            onSubmitEditing={() => confirmarCodigo()}
            accessibilityLabel={copy.codigo}
            placeholder={copy.codigo}
            placeholderTextColor={c.muted}
            style={{ height: 52, borderRadius: 14, borderWidth: 1, borderColor: "rgba(244,236,226,0.3)", color: c.ink, paddingHorizontal: 16, fontFamily: fonts.sans, fontSize: 16, letterSpacing: 4, textAlign: "center" }}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={copy.entrarCodigo}
            onPress={() => confirmarCodigo()}
            style={{ height: 52, borderRadius: 14, backgroundColor: c.accent, alignItems: "center", justifyContent: "center" }}
          >
            <Text style={{ color: c.accentInk, fontFamily: fonts.medium, fontSize: 16, fontWeight: "600" }}>{copy.entrarCodigo}</Text>
          </Pressable>
        </View>
      ) : null}
      {estado ? <Text style={{ color: c.accent, textAlign: "center", fontFamily: fonts.medium }}>{estado}</Text> : null}
    </View>
  );
}
