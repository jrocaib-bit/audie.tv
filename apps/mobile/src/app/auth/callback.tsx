import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabaseApp } from "../../auth";

export default function Callback() {
  const router = useRouter();
  useEffect(() => {
    void (async () => {
      const url = await Linking.getInitialURL();
      const remoto = supabaseApp();
      const code = url ? Linking.parse(url).queryParams?.code : "";
      if (remoto && typeof code === "string" && code) await remoto.auth.exchangeCodeForSession(code);
      const userId = (await remoto?.auth.getSession())?.data.session?.user.id;
      const consentimiento = (await AsyncStorage.getItem("audite.marketing.v1")) === "1";
      if (remoto && userId) {
        await remoto.from("email_preferencias").upsert({
          user_id: userId,
          marketing_consent: consentimiento,
          consent_at: consentimiento ? new Date().toISOString() : null,
        });
      }
      router.replace("/");
    })();
  }, [router]);
  return null;
}
