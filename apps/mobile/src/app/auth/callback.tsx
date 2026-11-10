import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { supabaseApp } from "../../auth";

export default function Callback() {
  const router = useRouter();
  useEffect(() => {
    void (async () => {
      const url = await Linking.getInitialURL();
      const remoto = supabaseApp();
      const code = url ? Linking.parse(url).queryParams?.code : "";
      if (remoto && typeof code === "string" && code) await remoto.auth.exchangeCodeForSession(code);
      router.replace("/");
    })();
  }, [router]);
  return null;
}
