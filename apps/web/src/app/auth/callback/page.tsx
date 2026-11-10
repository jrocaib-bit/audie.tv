"use client";

import { AUTH_URLS } from "@audite/domain";
import { useEffect } from "react";
import { migrarWeb, supabaseWeb } from "@/lib/auth-web";

export default function Page() {
  useEffect(() => {
    void (async () => {
      const remoto = supabaseWeb();
      const code = new URLSearchParams(window.location.search).get("code");
      if (remoto && code) await remoto.auth.exchangeCodeForSession(code);
      await migrarWeb();
      window.location.replace("/escuchar");
    })();
  }, []);
  return <main className="grid min-h-dvh place-items-center bg-[#100E0C] text-[#F4ECE2]"><p className="font-display text-3xl">{AUTH_URLS.sitio}</p></main>;
}
