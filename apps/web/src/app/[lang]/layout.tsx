import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { copiaSitio, idiomasPublicos } from "@/sitio/i18n";

export function generateStaticParams() {
  return idiomasPublicos.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const copy = copiaSitio(lang);
  if (!copy) return {};
  const languages = Object.fromEntries(idiomasPublicos.map((idioma) => [idioma, `/${idioma}`]));
  return {
    title: { absolute: copy.metaTitle },
    description: copy.metaDescription,
    alternates: {
      canonical: `/${lang}`,
      languages: { ...languages, "x-default": "/es" },
    },
  };
}

export default async function SitioLayout({ children, params }: { children: React.ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!copiaSitio(lang)) notFound();
  return <div lang={lang} className="lienzo min-h-dvh bg-[#100E0C] text-[#F4ECE2]">{children}</div>;
}
