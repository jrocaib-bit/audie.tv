import type { Metadata } from "next";
import { SALA_POR_DEFECTO } from "@/lib/sala-cuenta";
import { SalaPagina } from "./sala-pagina";

export const metadata: Metadata = { title: "La sala" };

export default async function Page({ params, searchParams }: { params: Promise<{ lang: string }>; searchParams: Promise<{ mock?: string }> }) {
  const { lang } = await params;
  const { mock } = await searchParams;
  return <SalaPagina lang={lang} id={SALA_POR_DEFECTO} mock={mock} />;
}
