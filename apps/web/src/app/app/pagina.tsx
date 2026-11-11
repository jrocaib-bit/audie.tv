"use client";

import Link from "next/link";
import { FormularioLanzamiento } from "@/components/formularios";
import { tiendasVisibles } from "@/lib/tiendas-app";

export function PaginaApp({ marca, idioma }: { marca: string; idioma: string }) {
  const tiendas = tiendasVisibles();
  return (
    <main id="aviso" className="mx-auto flex w-full max-w-lg flex-col gap-4 bg-[#100E0C] px-6 py-10 text-[#F4ECE2]">
      <h1 className="aparecer font-display text-5xl">La app</h1>
      <p className="text-[#B7AB9C]">Escucha la Biblia cada día en tu móvil. Empezamos el 29 de noviembre con el reto de Adviento. Déjanos tu correo y te avisamos el primer día.</p>
      <FormularioLanzamiento marca={marca} idioma={idioma} />
      {tiendas ? (
        <div className="grid gap-2">
          <a className="inline-flex min-h-12 items-center text-[#C9A96E]" href={tiendas.apple}>App Store</a>
          <a className="inline-flex min-h-12 items-center text-[#C9A96E]" href={tiendas.google}>Google Play</a>
        </div>
      ) : null}
      <Link className="boton inline-flex min-h-12 w-fit items-center rounded-full border border-[#F4ECE2]/30 px-6 text-[#F4ECE2]" href="/escuchar">Escuchar en la web</Link>
    </main>
  );
}
