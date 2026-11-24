"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { mockConSesion } from "@/components/enlace-cuenta";
import { BotonOro } from "@/components/sala/boton-oro";
import { sesionWeb } from "@/lib/auth-web";
import { episodioEscuchandoAhora } from "@/lib/sala-escuchando";
import type { SitioCopy } from "@/sitio/i18n";

function suscribirNada() {
  return () => {};
}

function Interior({
  lang,
  copy,
  fichas,
}: {
  lang: string;
  copy: SitioCopy;
  fichas: { id: string; href: string; titulo: string; libro: string }[];
}) {
  const mock = useSearchParams()?.get("mock");
  const forzar = mockConSesion(mock);
  const [sesionRemota, setSesionRemota] = useState(false);
  useEffect(() => {
    if (forzar) return;
    let vivo = true;
    void sesionWeb()
      .then((s) => {
        if (vivo) setSesionRemota(Boolean(s?.userId));
      })
      .catch(() => {
        if (vivo) setSesionRemota(false);
      });
    return () => {
      vivo = false;
    };
  }, [forzar]);
  const sesion = forzar || sesionRemota;
  const leerEscuchando = useCallback(() => (sesion ? episodioEscuchandoAhora() : null), [sesion]);
  const escuchando = useSyncExternalStore(suscribirNada, leerEscuchando, () => null);
  const ficha = escuchando ? fichas.find((f) => f.id === escuchando) : undefined;
  return (
    <>
      {sesion && ficha ? (
        <aside data-escuchando={ficha.id} className="mt-8 max-w-xl rounded-3xl border border-[#C9A96E]/60 bg-[#1B1815] p-5">
          <p className="t-rotulo text-[#C9A96E]">{copy.salaEscuchando}</p>
          <p className="mt-2 font-display text-2xl leading-tight">{ficha.titulo}</p>
          {ficha.libro ? <p className="mt-1 text-sm text-[#B7AB9C]">{ficha.libro}</p> : null}
          <Link href={ficha.href} className="mt-3 inline-flex min-h-11 items-center text-[#E0C48A] underline decoration-[#E0C48A]/40 underline-offset-4">
            {copy.salaVerObra}
          </Link>
        </aside>
      ) : null}
      {sesion === false ? (
        <div data-cta-sala="" className="mt-8 flex flex-wrap gap-3">
          <BotonOro asChild variante="oro"><Link href={`/${lang}/membresia`}>{copy.salaCtaTrial}</Link></BotonOro>
          <BotonOro asChild variante="fantasma"><Link href={`/${lang}/membresia`}>{copy.salaCtaPremium}</Link></BotonOro>
          <BotonOro asChild variante="fantasma"><Link href={`/${lang}/entrar`}>{copy.ctaSign}</Link></BotonOro>
        </div>
      ) : null}
    </>
  );
}

/** CTAs solo sin sesión, y la obra en curso cuando hay sesión (o `?mock=` en local). */
export function SalaIndiceCabecera(props: { lang: string; copy: SitioCopy; fichas: { id: string; href: string; titulo: string; libro: string }[] }) {
  return (
    <Suspense fallback={null}>
      <Interior {...props} />
    </Suspense>
  );
}
