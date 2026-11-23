"use client";

import { hrefEntrarParaSala, textosAlta, type Sesion } from "@audite/domain";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { Lienzo } from "@/components/sala/lienzo";
import { sesionWeb } from "@/lib/auth-web";
import { vistaSala } from "@/lib/sala-cuenta";

const INVITA = {
  es: "Crea tu cuenta gratis o entra para recorrer la obra, con sus textos y detalles.",
  en: "Create your free account or sign in to walk through the work, with its texts and details.",
};
const CREAR = { es: "Crear cuenta", en: "Create account" };

/** Adelanto (obra + título) para todos; el recorrido y sus textos, solo con sesión. `sesionMock` es solo para capturas en desarrollo. */
export function SalaCuenta({
  lang,
  src,
  obraId,
  alt,
  titulo,
  resumen,
  placa,
  sesionMock,
}: {
  lang: "es" | "en";
  src: string;
  obraId?: string;
  alt: string;
  titulo: string;
  resumen: string;
  placa?: ReactNode;
  sesionMock?: Pick<Sesion, "userId"> | null;
}) {
  const copy = textosAlta(lang);
  const [sesion, setSesion] = useState<Pick<Sesion, "userId"> | null | undefined>(sesionMock);
  useEffect(() => {
    if (sesionMock !== undefined) return;
    void sesionWeb().then(setSesion).catch(() => setSesion(null));
  }, [sesionMock]);
  const vista = vistaSala(sesion);

  return (
    <main className="bg-[#0C0B09] pb-28 text-[#F4ECE2]" data-vista={vista}>
      <Lienzo src={src} obraId={obraId} alt={alt} priority className="h-[62svh] md:h-[70svh]" />
      <div className="mx-auto w-full max-w-3xl px-5 pt-6 md:px-8">
        <h1 className="font-display t-h1">{titulo}</h1>
        {vista === "recorrido" ? (
          <section aria-label={titulo} className="mt-6 grid gap-6">
            <p className="max-w-prose text-lg leading-relaxed text-[#F4ECE2]/90">{resumen}</p>
            {placa ? <div className="max-w-sm">{placa}</div> : null}
          </section>
        ) : (
          <section data-candado className="mt-6 max-w-prose rounded-3xl border border-[#2E2924] bg-[#1B1815] p-6">
            <p className="text-lg leading-relaxed text-[#F4ECE2]/90">{INVITA[lang]}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href={hrefEntrarParaSala(lang)} className="inline-flex min-h-12 items-center rounded-full bg-[#C9A96E] px-6 text-[#100E0C]">{CREAR[lang]}</Link>
              <Link href={hrefEntrarParaSala(lang)} className="inline-flex min-h-12 items-center rounded-full border border-[#C9A96E] px-6 text-[#C9A96E]">{copy.entrar}</Link>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
