"use client";

import { PRECIO, etiquetaDeLanzamiento, letraDeLanzamiento, pideSuscripcion } from "@audite/domain";
import { useEffect, useState } from "react";
import { medir } from "@/lib/medicion";
import Link from "next/link";
import { tiendasVisibles } from "@/lib/tiendas-app";

export function PaywallWeb({ lang, lanzamiento = false, reto = null }: { lang: string; lanzamiento?: boolean; reto?: string | null }) {
  const es = lang !== "en";
  if (!pideSuscripcion(reto)) {
    return (
      <section className="mx-auto w-full max-w-xl px-5 py-16 text-[#F4ECE2]">
        <p className="font-display text-5xl leading-none">{es ? "Este reto es gratis." : "This challenge is free."}</p>
      </section>
    );
  }
  const idioma = es ? "es" : "en";
  const lanzamientoAnual = etiquetaDeLanzamiento(idioma, lanzamiento);
  const letraAnual = letraDeLanzamiento(idioma, lanzamiento);
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

  const tiendas = tiendasVisibles();

  return (
    <section className="mx-auto w-full max-w-xl px-5 py-16 text-[#F4ECE2]">
      <p className="text-sm tracking-[0.16em] text-[#C9A96E] uppercase">Audite Premium</p>
      <p className="font-display mt-3 text-5xl leading-none">Audite Premium</p>
      <p className="mt-4 text-[#B7AB9C]">{es ? "7 días gratis. Cancela cuando quieras." : "7 days free. Cancel anytime."}</p>
      <p className="mt-2 text-sm text-[#B7AB9C]">{es ? "Adviento con Isaías: gratis con tu cuenta." : "Advent with Isaiah: free with your account."}</p>
      <div className="mt-8 grid gap-3">
        <button type="button" aria-pressed={plan === "anual"} className={`rounded-2xl border px-5 py-4 text-left ${plan === "anual" ? "border-[#C9A96E]" : "border-[#2E2924]"}`} onClick={() => elegir("anual")}>
          <span className="block text-sm text-[#B7AB9C]">{es ? "Anual" : "Yearly"}</span>
          <span className="font-display mt-1 block text-4xl">{PRECIO.anio}/{es ? "año" : "year"}</span>
          {lanzamientoAnual ? <span className="mt-2 block text-sm text-[#C9A96E]">{lanzamientoAnual}</span> : null}
          {letraAnual ? <span className="mt-1 block text-sm text-[#B7AB9C]">{letraAnual}</span> : null}
        </button>
        <button type="button" aria-pressed={plan === "mensual"} className={`rounded-2xl border px-5 py-4 text-left ${plan === "mensual" ? "border-[#C9A96E]" : "border-[#2E2924]"}`} onClick={() => elegir("mensual")}>
          <span className="block text-sm text-[#B7AB9C]">{es ? "Mensual" : "Monthly"}</span>
          <span className="font-display mt-1 block text-4xl">{PRECIO.mes}/{es ? "mes" : "month"}</span>
        </button>
      </div>
      {tiendas ? (
        <div className="mt-6 grid gap-3">
          <button type="button" className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#C9A96E] px-6 text-[#100E0C]" onClick={() => tienda("apple", tiendas.apple)}>App Store</button>
          <button type="button" className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#F4ECE2]/30 px-6" onClick={() => tienda("google", tiendas.google)}>Google Play</button>
        </div>
      ) : <Link href="/app#aviso" className="mt-6 inline-flex min-h-12 items-center justify-center rounded-full bg-[#C9A96E] px-6 text-[#100E0C]">Avísame</Link>}
    </section>
  );
}
