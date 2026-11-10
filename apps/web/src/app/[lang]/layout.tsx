import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { canonicalPropio } from "@/lib/sitio-publico";
import { copiaSitio, idiomasPublicos } from "@/sitio/i18n";

export function generateStaticParams() {
  return idiomasPublicos.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const copy = copiaSitio(lang);
  if (!copy) return {};
  const ruta = (await headers()).get("x-audite-path") || `/${lang}`;
  const languages = Object.fromEntries(idiomasPublicos.map((idioma) => [idioma, canonicalPropio(ruta.replace(`/${lang}`, `/${idioma}`) || `/${idioma}`, idioma)]));
  return {
    title: { absolute: copy.metaTitle },
    description: copy.metaDescription,
    alternates: {
      canonical: canonicalPropio(ruta, lang),
      languages: { ...languages, "x-default": canonicalPropio(ruta.replace(`/${lang}`, "/es") || "/es", "es") },
    },
  };
}

export default async function SitioLayout({ children, params }: { children: React.ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!copiaSitio(lang)) notFound();
  return <div lang={lang} className="lienzo min-h-dvh bg-[#100E0C] text-[#F4ECE2]">{children}</div>;
}
