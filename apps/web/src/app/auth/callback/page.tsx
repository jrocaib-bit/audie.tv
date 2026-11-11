"use client";

import { AUTH_URLS, filaPreferenciaCorreo } from "@audite/domain";
import { useEffect } from "react";
import { migrarWeb, supabaseWeb } from "@/lib/auth-web";
import { medir } from "@/lib/medicion";

export default function Page() {
  useEffect(() => {
    void (async () => {
      const remoto = supabaseWeb();
      const code = new URLSearchParams(window.location.search).get("code");
      if (remoto && code) await remoto.auth.exchangeCodeForSession(code);
      const proveedor = (await remoto?.auth.getSession())?.data.session?.user.app_metadata?.provider;
      const metodo = proveedor === "apple" || proveedor === "google" ? proveedor : "correo";
      medir("signup_completed", { proveedor: metodo });
      const cta = metodo === "apple" ? "alta_apple" : metodo === "google" ? "alta_google" : "alta_magic_link";
      medir("signup_confirmed", { form_id: "alta_entrar", cta_id: cta, ubicacion: "callback", idioma: document.documentElement.lang || "es", plataforma: "web", metodo });
      const userId = (await remoto?.auth.getSession())?.data.session?.user.id;
      const consentimiento = window.localStorage.getItem("audite.marketing.v1") === "1";
      if (remoto && userId) {
        await remoto.from("email_preferencias").upsert(filaPreferenciaCorreo(userId, consentimiento));
      }
      await migrarWeb();
      window.location.replace("/escuchar");
    })();
  }, []);
  return <main className="grid min-h-dvh place-items-center bg-[#100E0C] text-[#F4ECE2]"><p className="font-display text-3xl">{AUTH_URLS.sitio}</p></main>;
}
