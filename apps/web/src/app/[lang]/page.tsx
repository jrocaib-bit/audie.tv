import type { Metadata } from "next";
import { SitioHome } from "@/components/sitio";
import { canonicalPropio } from "@/lib/sitio-publico";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  return { alternates: { canonical: canonicalPropio(`/${lang}`, lang) } };
}

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return <SitioHome lang={lang} />;
}
