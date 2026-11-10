import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { filaPreferenciaCorreo, plataformaCliente } from "@audite/domain";
import { supabaseApp } from "../../auth";
import { medir } from "../../medicion";
import { useMobileLibrary } from "../../state";

export default function Callback() {
  const router = useRouter();
  const idioma = useMobileLibrary().settings.uiLocale;
  useEffect(() => {
    void (async () => {
      const url = await Linking.getInitialURL();
      const remoto = supabaseApp();
      const code = url ? Linking.parse(url).queryParams?.code : "";
      if (remoto && typeof code === "string" && code) await remoto.auth.exchangeCodeForSession(code);
      const userId = (await remoto?.auth.getSession())?.data.session?.user.id;
      const consentimiento = (await AsyncStorage.getItem("audite.marketing.v1")) === "1";
      if (remoto && userId) {
        await remoto.from("email_preferencias").upsert(filaPreferenciaCorreo(userId, consentimiento));
        medir("signup_confirmed", { form_id: "alta_entrar", cta_id: "alta_magic_link", ubicacion: "callback", idioma, plataforma: plataformaCliente(Platform.OS) });
      }
      router.replace("/");
    })();
  }, [idioma, router]);
  return null;
}
