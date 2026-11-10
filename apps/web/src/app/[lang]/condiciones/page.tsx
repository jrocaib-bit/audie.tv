import { PRECIO, textosAlta } from "@audite/domain";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { esIdiomaPublico } from "@/sitio/i18n";

export const metadata: Metadata = { title: "Condiciones" };

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!esIdiomaPublico(lang)) notFound();
  const copy = textosAlta(lang);
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center bg-[#100E0C] px-6 py-16 text-[#F4ECE2]">
      <h1 className="font-display text-5xl">{copy.condiciones}</h1>
      <p className="mt-6 text-lg">{copy.titulo}</p>
      <p className="mt-3 text-[#B7AB9C]">{PRECIO.mes} · {PRECIO.anio}</p>
    </main>
  );
}
