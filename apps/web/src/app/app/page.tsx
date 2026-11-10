"use client";

import Link from "next/link";
import { useEffect } from "react";
import { URL_APP_STORE, URL_PLAY_STORE } from "@/lib/tiendas-app";

export default function Page() {
  useEffect(() => {
    const agente = navigator.userAgent;
    if (/android/i.test(agente)) window.location.replace(URL_PLAY_STORE);
    else if (/iPhone|iPad|iPod/i.test(agente)) window.location.replace(URL_APP_STORE);
    else window.location.replace("/escuchar");
  }, []);
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center gap-4 bg-[#100E0C] px-6 text-[#F4ECE2]">
      <h1 className="font-display text-5xl">Audite</h1>
      <a className="inline-flex min-h-12 items-center text-[#C9A96E]" href={URL_APP_STORE}>App Store</a>
      <a className="inline-flex min-h-12 items-center text-[#C9A96E]" href={URL_PLAY_STORE}>Google Play</a>
      <Link className="inline-flex min-h-12 items-center" href="/escuchar">Escuchar en la web</Link>
    </main>
  );
}
