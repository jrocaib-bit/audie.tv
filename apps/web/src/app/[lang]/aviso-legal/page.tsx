import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AvisoLegal } from "@/components/aviso-legal";
import { canonicalPropio } from "@/lib/sitio-publico";
import { esIdiomaPublico } from "@/sitio/i18n";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  return { title: "Aviso legal", alternates: { canonical: canonicalPropio(`/${lang}/aviso-legal`, lang) } };
}

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!esIdiomaPublico(lang)) notFound();
  return <AvisoLegal />;
}
