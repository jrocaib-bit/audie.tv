"use client";

import Link from "next/link";
import { FormularioLanzamiento } from "@/components/formularios";
import { tiendasVisibles } from "@/lib/tiendas-app";

export function PaginaApp({ marca, idioma }: { marca: string; idioma: string }) {
  const tiendas = tiendasVisibles();
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center gap-4 bg-[#100E0C] px-6 py-16 text-[#F4ECE2]">
      <h1 className="font-display text-5xl">La app</h1>
      <p className="text-[#B7AB9C]">Próximamente en el móvil.</p>
      <FormularioLanzamiento marca={marca} idioma={idioma} />
      {tiendas ? (
        <div className="grid gap-2">
          <a className="inline-flex min-h-12 items-center text-[#C9A96E]" href={tiendas.apple}>App Store</a>
          <a className="inline-flex min-h-12 items-center text-[#C9A96E]" href={tiendas.google}>Google Play</a>
        </div>
      ) : null}
      <Link className="inline-flex min-h-12 items-center" href="/escuchar">Escuchar en la web</Link>
    </main>
  );
}
