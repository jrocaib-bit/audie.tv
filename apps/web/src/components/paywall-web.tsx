"use client";

import { PRECIO, PRECIO_ANUAL_SIGUIENTE, pideSuscripcion, textosAlta } from "@audite/domain";
import { useEffect, useState } from "react";
import { medir } from "@/lib/medicion";
import Link from "next/link";
import { tiendasVisibles } from "@/lib/tiendas-app";
import { BotonOro } from "@/components/sala/boton-oro";
import { PlanCard } from "@/components/sala/plan-card";

export function PaywallWeb({ lang, lanzamiento = false, reto = null }: { lang: string; lanzamiento?: boolean; reto?: string | null }) {
  const es = lang !== "en";
  if (!pideSuscripcion(reto)) {
    return (
      <section className="mx-auto w-full max-w-xl px-5 py-16 text-[#F4ECE2]">
        <p className="font-display text-5xl leading-none">{es ? "Este reto es gratis." : "This challenge is free."}</p>
      </section>
    );
  }
  return <PaywallDePago lanzamiento={lanzamiento} es={es} />;
}

function PaywallDePago({ lanzamiento, es }: { lanzamiento: boolean; es: boolean }) {
  const [plan, setPlan] = useState<"anual" | "mensual">("anual");
  useEffect(() => {
    medir("paywall_view", { origen: "web" });
  }, []);
  const idioma = es ? "es" : "en";

  function elegir(siguiente: "anual" | "mensual") {
    setPlan(siguiente);
    medir("plan_selected", { plan: siguiente });
  }

  function tienda(nombre: "apple" | "google", href: string) {
    medir("store_click", { tienda: nombre });
    if (href) window.location.assign(href);
  }

  const tiendas = tiendasVisibles();
  const lang = es ? "es" : "en";
  const legal = textosAlta(lang);

  return (
    <section className="mx-auto w-full max-w-xl px-5 py-12 text-[#F4ECE2] md:py-16">
      <p className="t-rotulo text-[#C9A96E]">{es ? "7 días gratis" : "7 days free"}</p>
      <h1 className="font-display t-display mt-3">Audite Premium</h1>
      <p className="mt-4 text-[#B7AB9C]">{es ? "7 días gratis. Cancela cuando quieras." : "7 days free. Cancel anytime."}</p>
      <p className="t-meta mt-2">{es ? "Adviento con Isaías: gratis con tu cuenta." : "Advent with Isaiah: free with your account."}</p>
      <PlanCard ui={idioma} plan={plan} onPlan={elegir} className="mt-8" lanzamiento={lanzamiento}>
        {tiendas ? (
          <div className="grid gap-3">
            <BotonOro className="w-full" onClick={() => tienda("apple", tiendas.apple)}>App Store</BotonOro>
            <BotonOro variante="secundario" className="w-full" onClick={() => tienda("google", tiendas.google)}>Google Play</BotonOro>
          </div>
        ) : (
          <>
            <BotonOro asChild className="w-full"><Link href="/app#aviso">{es ? "Avísame" : "Notify me"}</Link></BotonOro>
            <p className="t-meta mt-2">{es ? "Te escribimos cuando la app esté en las tiendas." : "We will write to you when the app is in the stores."}</p>
          </>
        )}
      </PlanCard>
      <p className="mt-6 text-sm text-[#E7D7C3]">
        {es
          ? `Precio actual: ${PRECIO.anio}/año o ${PRECIO.mes}/mes. A partir del 6 de enero de 2027, las altas anuales nuevas cuestan ${PRECIO_ANUAL_SIGUIENTE} al año. Quien se suscriba antes mantiene ${PRECIO.anio} al año mientras su suscripción siga activa.`
          : `Current price: ${PRECIO.anio}/year or ${PRECIO.mes}/month. From 6 January 2027, new yearly subscriptions cost ${PRECIO_ANUAL_SIGUIENTE} a year. If you subscribe before then, you keep ${PRECIO.anio} a year for as long as your subscription stays active.`}
      </p>
      <p className="mt-2 text-sm text-[#B7AB9C]">
        {es
          ? "Si cancelas, sigues con acceso hasta que termine el periodo ya pagado. Si la suscripción caduca o cambias de plan, se aplica la tarifa de ese momento."
          : "If you cancel, you keep access until the period you already paid for ends. If the subscription lapses or you change plan, the rate at that time applies."}
      </p>
      <p className="t-meta mt-6 flex flex-wrap gap-x-4">
        <Link href={`/${lang}/condiciones`} className="inline-flex min-h-11 items-center underline">{legal.condiciones}</Link>
        <Link href={`/${lang}/privacidad`} className="inline-flex min-h-11 items-center underline">{legal.privacidad}</Link>
      </p>
    </section>
  );
}
