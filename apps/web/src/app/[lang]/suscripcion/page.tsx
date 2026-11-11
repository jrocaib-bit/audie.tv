import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { precioLanzamientoActivo } from "@audite/domain";
import { PaywallWeb } from "@/components/paywall-web";
import { esIdiomaPublico } from "@/sitio/i18n";

export const metadata: Metadata = { title: "Audite Premium" };

export default async function Page({ params, searchParams }: { params: Promise<{ lang: string }>; searchParams: Promise<{ reto?: string }> }) {
  const { lang } = await params;
  const { reto } = await searchParams;
  if (!esIdiomaPublico(lang)) notFound();
  return (
    <main className="min-h-dvh bg-[#100E0C]">
      <PaywallWeb lang={lang} lanzamiento={precioLanzamientoActivo()} reto={reto ?? null} />
    </main>
  );
}
