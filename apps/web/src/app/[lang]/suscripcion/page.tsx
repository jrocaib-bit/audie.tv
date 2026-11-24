import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { precioLanzamientoActivo } from "@audite/domain";
import { obraDeEpisodio, obraWebp } from "@audite/content/obras";
import { PaywallWeb } from "@/components/paywall-web";
import { Placa } from "@/components/placa";
import { Lienzo } from "@/components/sala/lienzo";
import { esIdiomaPublico } from "@/sitio/i18n";

export const metadata: Metadata = { title: "Audite Premium" };

export default async function Page({ params, searchParams }: { params: Promise<{ lang: string }>; searchParams: Promise<{ reto?: string }> }) {
  const { lang } = await params;
  const { reto } = await searchParams;
  if (!esIdiomaPublico(lang)) notFound();
  const obra = obraDeEpisodio("gn-05");
  return (
    <main className="min-h-dvh bg-[#0C0B09] md:grid md:grid-cols-2 md:items-center">
      {obra ? (
        <div className="md:sticky md:top-0 md:h-dvh">
          <Lienzo src={obraWebp(obra)} obraId={obra.id} alt={obra.titulo[lang === "en" ? "en" : "es"]} priority className="h-[44svh] md:h-full">
            <div className="absolute inset-x-0 bottom-0 z-10 hidden p-4 md:block"><Placa obra={obra} lang={lang} /></div>
          </Lienzo>
        </div>
      ) : null}
      <PaywallWeb lang={lang} lanzamiento={precioLanzamientoActivo()} reto={reto ?? null} />
    </main>
  );
}
