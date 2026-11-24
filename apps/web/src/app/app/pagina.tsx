"use client";

import Link from "next/link";
import { FormularioLanzamiento } from "@/components/formularios";
import { BotonOro } from "@/components/sala/boton-oro";
import { tiendasVisibles } from "@/lib/tiendas-app";

export function PaginaApp({ marca, idioma }: { marca: string; idioma: string }) {
  const tiendas = tiendasVisibles();
  const en = idioma === "en";
  return (
    <main id="aviso" className="mx-auto flex w-full max-w-lg flex-col gap-4 bg-[#100E0C] px-6 py-10 text-[#F4ECE2]">
      <h1 className="aparecer font-display t-h1">{en ? "The app" : "La app"}</h1>
      <p className="text-[#B7AB9C]">
        {en
          ? "Listen to the Bible every day on your phone. We begin on 29 November with the Advent challenge. Leave your email and we will let you know on day one."
          : "Escucha la Biblia cada día en tu móvil. Empezamos el 29 de noviembre con el reto de Adviento. Déjanos tu correo y te avisamos el primer día."}
      </p>
      <div className="rounded-3xl border border-[#2E2924] bg-[#1B1815] p-5">
        <FormularioLanzamiento marca={marca} idioma={idioma} />
      </div>
      {tiendas ? (
        <div className="grid gap-2">
          <a className="inline-flex min-h-12 items-center text-[#C9A96E]" href={tiendas.apple}>App Store</a>
          <a className="inline-flex min-h-12 items-center text-[#C9A96E]" href={tiendas.google}>Google Play</a>
        </div>
      ) : null}
      <BotonOro asChild variante="fantasma" className="w-fit border-[#F4ECE2]/30"><Link href="/escuchar">{en ? "Listen on the web" : "Escuchar en la web"}</Link></BotonOro>
    </main>
  );
}
