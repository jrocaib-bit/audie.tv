"use client";

import { elegirPortadaHoy } from "@audite/content/obras-creditos";
import { COLOR_HEX, diaLiturgico, pasoDelDia, referenciaPaso, retosDelDia } from "@audite/domain";
import Link from "next/link";
import { RETOS } from "@/lib/retos";
import { copiaSitio } from "@/sitio/i18n";

export function HoyFranja({ lang }: { lang: string }) {
  const copy = copiaSitio(lang);
  const dia = diaLiturgico(new Date());
  const reto = retosDelDia(dia, RETOS)[0];
  const paso = pasoDelDia(dia, RETOS);
  const ui = lang === "en" ? "en" : "es";
  if (!copy || !reto || !paso) return null;
  const portada = elegirPortadaHoy({ retoId: reto.id, libroId: paso.libroId, episodio: paso.episodio });
  const titulo = (reto.tituloCorto ?? reto.titulo)[ui];
  const tinta = dia.color === "blanco" || dia.color === "rosa" ? "text-[#100E0C]" : "text-[#F4ECE2]";
  return (
    <section id="hoy" className="bg-[#100E0C] text-[#F4ECE2]">
      <div className="mx-auto w-full max-w-6xl md:flex md:items-center md:gap-10 md:px-8 md:py-12">
        {portada.tipo === "tiempo" ? (
          <span className={`flex aspect-[16/9] w-full items-end p-5 md:aspect-square md:w-72 md:shrink-0 ${tinta}`} style={{ background: COLOR_HEX[dia.color] }}>
            <span className="font-display text-3xl leading-none">{dia.nombre[ui]}</span>
          </span>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={portada.src} alt="" className="aspect-[16/9] w-full object-cover md:aspect-square md:w-72 md:shrink-0" />
        )}
        <div className="px-5 py-6 md:min-w-0 md:flex-1 md:px-0 md:py-0">
          <p className="text-sm text-[#C9A96E]">{copy.hoy}</p>
          <h2 className="font-display mt-2 text-[2rem] leading-[0.95] md:text-5xl">{titulo}</h2>
          <p className="mt-3 whitespace-nowrap text-[#B7AB9C]">{paso.titulo[ui]} · {referenciaPaso(paso, ui)}</p>
          <Link href={`/reto/${reto.id}`} className="audite-pulso mt-5 flex min-h-12 w-full items-center justify-center rounded-full bg-[#C9A96E] px-5 text-[#100E0C] md:w-fit md:px-6">{copy.ctaAdvent}</Link>
        </div>
      </div>
    </section>
  );
}
