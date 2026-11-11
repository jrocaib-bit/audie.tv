import type { Metadata } from "next";
import { Entrar } from "@/components/entrar";
import { esIdiomaPublico } from "@/sitio/i18n";
import { notFound } from "next/navigation";

export const metadata: Metadata = { title: "Entrar" };

function uno(valor: string | string[] | undefined): string {
  return Array.isArray(valor) ? valor[0] ?? "" : valor ?? "";
}

export default async function Page({ params, searchParams }: { params: Promise<{ lang: string }>; searchParams: Promise<{ siguiente?: string | string[]; oir?: string | string[]; aviso?: string | string[] }> }) {
  const { lang } = await params;
  const query = await searchParams;
  if (!esIdiomaPublico(lang)) notFound();
  return <Entrar lang={lang} google={process.env.GOOGLE_LOGIN_ENABLED === "true"} siguiente={uno(query.siguiente)} oir={uno(query.oir)} aviso={uno(query.aviso)} />;
}
