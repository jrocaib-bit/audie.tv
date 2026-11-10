import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Privacidad } from "@/components/privacidad";
import { esIdiomaPublico } from "@/sitio/i18n";

export const metadata: Metadata = { title: "Privacidad" };

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!esIdiomaPublico(lang)) notFound();
  return <Privacidad inicio={`/${lang}`} />;
}
