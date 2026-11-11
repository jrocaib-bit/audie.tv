import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { loadAppCatalog } from "@audite/content/app-catalog";
import { VistaRetoAnio } from "@/components/reto-anio";
import { retoDeTemporada } from "@/lib/retos-anio";
import { esIdiomaPublico } from "@/sitio/i18n";

export async function generateMetadata({ params }: { params: Promise<{ lang: string; id: string }> }): Promise<Metadata> {
  const { lang, id } = await params;
  const reto = retoDeTemporada(id);
  const ui = lang === "en" ? "en" : "es";
  return { title: reto?.titulo[ui] ?? "Audite" };
}

export default async function Page({ params }: { params: Promise<{ lang: string; id: string }> }) {
  const { lang, id } = await params;
  if (!esIdiomaPublico(lang)) notFound();
  const reto = retoDeTemporada(id);
  if (!reto) notFound();
  return <VistaRetoAnio lang={lang} reto={reto} rangos={loadAppCatalog().rangos} />;
}
