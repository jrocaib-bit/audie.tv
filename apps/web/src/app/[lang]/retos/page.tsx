import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { VistaRetos } from "@/components/sala/vista-retos";
import { esIdiomaPublico } from "@/sitio/i18n";

export const metadata: Metadata = { title: "Retos", description: "Escucha la Biblia de principio a fin, y los retos del año." };

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!esIdiomaPublico(lang)) notFound();
  return <VistaRetos lang={lang} />;
}
