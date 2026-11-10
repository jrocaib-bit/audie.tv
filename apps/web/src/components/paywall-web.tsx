"use client";

import { PRECIO } from "@audite/domain";
import { useEffect, useState } from "react";
import { medir } from "@/lib/medicion";
import { URL_APP_STORE, URL_PLAY_STORE } from "@/lib/tiendas-app";

export function PaywallWeb({ lang }: { lang: string }) {
  const es = lang !== "en";
  const [plan, setPlan] = useState<"anual" | "mensual">("anual");
  useEffect(() => {
    medir("paywall_view", { origen: "web" });
  }, []);

  function elegir(siguiente: "anual" | "mensual") {
    setPlan(siguiente);
    medir("plan_selected", { plan: siguiente });
  }

  function tienda(nombre: "apple" | "google", href: string) {
    medir("store_click", { tienda: nombre });
    if (href) window.location.assign(href);
  }

  const cifra = plan === "anual" ? `${PRECIO.anio}/${es ? "año" : "year"}` : `${PRECIO.mes}/${es ? "mes" : "month"}`;

  return (
    <section className="mx-auto w-full max-w-xl px-5 py-16 text-[#F4ECE2]">
      <p className="text-sm tracking-[0.16em] text-[#C9A96E] uppercase">Audite Premium</p>
      <h1 className="font-display mt-3 text-5xl leading-none">{es ? "Escucha en la app." : "Listen in the app."}</h1>
      <p className="mt-4 text-[#B7AB9C]">{es ? "7 días gratis. El alta es en la tienda." : "7 days free. Sign-up is in the store."}</p>
      <div className="mt-8 grid gap-3">
        <button type="button" aria-pressed={plan === "anual"} className={`rounded-2xl border px-5 py-4 text-left ${plan === "anual" ? "border-[#C9A96E]" : "border-[#2E2924]"}`} onClick={() => elegir("anual")}>
          <span className="block text-sm text-[#B7AB9C]">{es ? "Anual" : "Yearly"}</span>
          <span className="font-display mt-1 block text-4xl">{PRECIO.anio}/{es ? "año" : "year"}</span>
        </button>
        <button type="button" aria-pressed={plan === "mensual"} className={`rounded-2xl border px-5 py-4 text-left ${plan === "mensual" ? "border-[#C9A96E]" : "border-[#2E2924]"}`} onClick={() => elegir("mensual")}>
          <span className="block text-sm text-[#B7AB9C]">{es ? "Mensual" : "Monthly"}</span>
          <span className="font-display mt-1 block text-4xl">{PRECIO.mes}/{es ? "mes" : "month"}</span>
        </button>
      </div>
      <p className="font-display mt-6 text-3xl">{cifra}</p>
      <div className="mt-6 grid gap-3">
        <button type="button" className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#C9A96E] px-6 text-[#100E0C]" onClick={() => tienda("apple", URL_APP_STORE)}>App Store</button>
        <button type="button" className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#F4ECE2]/30 px-6" onClick={() => tienda("google", URL_PLAY_STORE)}>Google Play</button>
      </div>
    </section>
  );
}
