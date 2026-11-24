import type { Metadata } from "next";
import { SitioBiblia } from "@/components/biblia/indice-biblia";
import { copiaSitio } from "@/sitio/i18n";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const copy = copiaSitio(lang);
  if (!copy) return { title: "Audite" };
  return { title: { absolute: `${copy.bibleTitle} · Audite` }, description: copy.bibleMetaDescription };
}

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return <SitioBiblia lang={lang} />;
}
