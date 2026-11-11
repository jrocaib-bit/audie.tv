import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PaginaApp } from "@/app/app/pagina";
import { marcaFormulario } from "@/lib/formularios/acciones";
import { canonicalPropio, origenSitio } from "@/lib/sitio-publico";
import { esIdiomaPublico } from "@/sitio/i18n";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const base = origenSitio();
  return {
    title: "La app de Audite",
    description: "Avísame cuando la app esté disponible. Mientras, escucha en la web.",
    alternates: { canonical: canonicalPropio(`/${lang}/app`, lang) },
    openGraph: { title: "La app de Audite", description: "Avísame cuando la app esté disponible.", url: `${base}/${lang}/app`, images: [`${base}/obras/reto-adviento_o2-16x9.webp`] },
  };
}

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!esIdiomaPublico(lang)) notFound();
  return <PaginaApp marca={await marcaFormulario()} idioma={lang} />;
}
