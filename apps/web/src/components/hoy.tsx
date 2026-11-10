"use client";

import { obraWebp, obrasVisibles } from "@audite/content/obras";
import { portadaDeReto } from "@audite/content/obras-creditos";
import { diaLiturgico, pasoDelDia, referenciaPaso, retosDelDia } from "@audite/domain";
import Link from "next/link";
import { RETOS } from "@/lib/retos";
import { copiaSitio } from "@/sitio/i18n";

export function HoyFranja({ lang }: { lang: string }) {
  const copy = copiaSitio(lang);
  const dia = diaLiturgico(new Date());
  const reto = retosDelDia(dia, RETOS)[0];
  const paso = pasoDelDia(dia, RETOS);
  const ui = lang === "en" ? "en" : "es";
  const obra = obrasVisibles().find((item) => item.episodio === (paso?.obra || reto?.obra));
  const poster = (reto ? portadaDeReto(reto.id)?.src.cuadrado : null) ?? (obra ? obraWebp(obra) : null);
  if (!copy || !reto || !paso) return null;
  const titulo = (reto.tituloCorto ?? reto.titulo)[ui];
  return (
    <section className="bg-[#100E0C] px-5 py-8 text-[#F4ECE2] md:px-8">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-4">
        {poster ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={poster} alt="" className="size-20 shrink-0 object-cover md:size-28" />
        ) : <span className="size-20 shrink-0 bg-[#1B1815]" />}
        <div className="min-w-0 flex-1">
          <p className="text-sm text-[#C9A96E]">{copy.hoy}</p>
          <p className="font-display text-2xl leading-tight md:text-4xl">{titulo}</p>
          <p className="text-[#B7AB9C]">{paso.titulo[ui]} · {referenciaPaso(paso, ui)}</p>
        </div>
        <Link href={`/reto/${reto.id}`} className="audite-pulso ml-auto inline-flex min-h-12 shrink-0 items-center rounded-full bg-[#C9A96E] px-5 text-[#100E0C]">{copy.ctaAdvent}</Link>
      </div>
    </section>
  );
}
