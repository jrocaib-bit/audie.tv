import { PRECIO, textosAlta } from "@audite/domain";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BloqueTitular } from "@/components/titular";
import { esIdiomaPublico } from "@/sitio/i18n";

export const metadata: Metadata = { title: "Condiciones" };

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!esIdiomaPublico(lang)) notFound();
  const copy = textosAlta(lang);
  return (
    <main className="mx-auto min-h-dvh w-full max-w-2xl bg-[#100E0C] px-6 py-16 text-[#F4ECE2]">
      <p className="text-sm tracking-[0.16em] text-[#C9A96E] uppercase">Borrador</p>
      <h1 className="font-display text-5xl">{copy.condiciones}</h1>
      <p className="mt-4 text-[#C9A96E]">BORRADOR. Pendiente de revisión legal.</p>
      <p className="mt-2 text-[#B7AB9C]">Última actualización: 10 de noviembre de 2026.</p>
      <BloqueTitular />
      <p className="mt-8 text-lg">{copy.titulo}</p>
      <p className="mt-3 text-[#B7AB9C]">{PRECIO.mes} · {PRECIO.anio}</p>
      <p className="mt-3">La web no cobra. La suscripción de la app se contrata en el App Store.</p>
    </main>
  );
}
