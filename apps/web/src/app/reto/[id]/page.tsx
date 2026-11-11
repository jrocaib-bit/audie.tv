import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { portadaDeReto } from "@audite/content/obras-creditos";
import { Esqueleto } from "@/components/v2/esqueleto";
import { MarcoSitio } from "@/components/sitio";
import { RetoV2 } from "@/components/v2/reto";
import { RETOS } from "@/lib/retos";

const sitio = "https://audite.tv";

export function generateStaticParams() {
  return RETOS.map((reto) => ({ id: reto.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const reto = RETOS.find((item) => item.id === id);
  if (!reto) return { title: "Reto" };
  const titulo = reto.titulo.es;
  const description = `${titulo}. La Biblia, de principio a fin.`;
  const imagen = portadaDeReto(reto.id)?.src.ancho;
  return {
    title: titulo,
    description,
    openGraph: {
      title: titulo,
      description,
      url: `${sitio}/reto/${reto.id}`,
      siteName: "Audite",
      type: "website",
      images: imagen ? [{ url: `${sitio}${imagen}`, alt: titulo }] : undefined,
    },
    twitter: { card: imagen ? "summary_large_image" : "summary", title: titulo, description },
  };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const reto = RETOS.find((item) => item.id === id);
  if (!reto) notFound();
  return (
    <MarcoSitio lang="es">
      <h1 className="bg-[#100E0C] px-5 pt-16 font-display text-5xl leading-[0.92] text-[#F4ECE2] md:px-8 md:text-7xl">{reto.titulo.es}</h1>
      <Suspense fallback={<Esqueleto />}>
        <RetoV2 reto={reto} tituloServidor />
      </Suspense>
    </MarcoSitio>
  );
}
