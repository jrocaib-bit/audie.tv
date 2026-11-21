import * as Linking from "expo-linking";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { filaPreferenciaCorreo, plataformaCliente } from "@audite/domain";
import { aplicarEnlaceAuth, supabaseApp } from "../../auth";
import { medir } from "../../medicion";
import { useMobileLibrary } from "../../state";

export default function Callback() {
  const router = useRouter();
  const params = useLocalSearchParams<{ code?: string; token_hash?: string; type?: string }>();
  const idioma = useMobileLibrary().settings.uiLocale;
  useEffect(() => {
    void (async () => {
      const code = typeof params.code === "string" ? params.code : "";
      const tokenHash = typeof params.token_hash === "string" ? params.token_hash : "";
      const tipo = typeof params.type === "string" ? params.type : "email";
      if (code) await aplicarEnlaceAuth(`audite://auth/callback?code=${encodeURIComponent(code)}`);
      else if (tokenHash) await aplicarEnlaceAuth(`audite://auth/callback?token_hash=${encodeURIComponent(tokenHash)}&type=${encodeURIComponent(tipo)}`);
      const url = await Linking.getInitialURL();
      if (url) await aplicarEnlaceAuth(url);
      const remoto = supabaseApp();
      const userId = (await remoto?.auth.getSession())?.data.session?.user.id;
      const consentimiento = (await AsyncStorage.getItem("audite.marketing.v1")) === "1";
      if (remoto && userId) {
        await remoto.from("email_preferencias").upsert(filaPreferenciaCorreo(userId, consentimiento));
        medir("signup_confirmed", { form_id: "alta_entrar", cta_id: "alta_magic_link", ubicacion: "callback", idioma, plataforma: plataformaCliente(Platform.OS) });
      }
      router.replace("/");
    })();
  }, [idioma, params.code, params.token_hash, params.type, router]);
  return null;
}
