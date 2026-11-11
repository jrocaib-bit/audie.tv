import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { MarcoSitio } from "@/components/sitio";
import { canonicalPropio, muestraNovedades } from "@/lib/sitio-publico";
import { copiaSitio, idiomasPublicos } from "@/sitio/i18n";

const TIEMPOS_DE_RETO = new Set(["adviento", "advent", "navidad", "christmas", "cuaresma", "lent", "pascua", "easter", "ordinario", "ordinary", "semana-santa", "holy-week"]);

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
  const ruta = (await headers()).get("x-audite-path") || "";
  const inicio = ruta === `/${lang}` || ruta === `/${lang}/`;
  const resto = ruta.startsWith(`/${lang}/`) ? ruta.slice(lang.length + 2) : "";
  const sobreObra = inicio || new RegExp(`^${lang}/retos/[^/]+$`).test(ruta.slice(1)) || TIEMPOS_DE_RETO.has(resto);
  return (
    <div lang={lang} className={`${sobreObra ? "relative " : ""}lienzo min-h-dvh bg-[#100E0C] text-[#F4ECE2]`}>
      <MarcoSitio lang={lang} sobreObra={sobreObra} novedades={muestraNovedades(ruta, lang)}>{children}</MarcoSitio>
    </div>
  );
}
