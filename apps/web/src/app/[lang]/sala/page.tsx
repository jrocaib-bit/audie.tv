import type { Metadata } from "next";
import { SitioSala } from "@/components/sala/sala-indice";
import { copiaSitio } from "@/sitio/i18n";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const copy = copiaSitio(lang);
  return { title: copy ? { absolute: `${copy.salaTitle} · Audite` } : "Audite" };
}

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return <SitioSala lang={lang} />;
}
