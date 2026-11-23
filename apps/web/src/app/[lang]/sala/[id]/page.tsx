import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { idsSala, recorridoSala } from "@/lib/sala-cuenta";
import { SalaPagina } from "../sala-pagina";

export const metadata: Metadata = { title: "La sala" };
export const dynamicParams = false;

export function generateStaticParams() {
  return idsSala().map((id) => ({ id }));
}

export default async function Page({ params, searchParams }: { params: Promise<{ lang: string; id: string }>; searchParams: Promise<{ mock?: string }> }) {
  const { lang, id } = await params;
  const { mock } = await searchParams;
  if (!recorridoSala(id)) notFound();
  return <SalaPagina lang={lang} id={id} mock={mock} />;
}
