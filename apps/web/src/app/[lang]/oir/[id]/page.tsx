import type { Metadata } from "next";
import { loadAppCatalog } from "@audite/content/app-catalog";
import { obraDeEpisodio, obraWebp } from "@audite/content/obras";
import { BotonProbar, ProbarAudio } from "@/components/probar";
import { Placa } from "@/components/placa";
import { BotonOro, botonOroVariantes } from "@/components/sala/boton-oro";
import { Lienzo } from "@/components/sala/lienzo";
import { copiaSitio } from "@/sitio/i18n";
import { rutaSala } from "@/lib/sala-cuenta";
import { idsSala } from "@/lib/sala-recorridos";
import Link from "next/link";

function buscar(id: string) {
  const catalogo = loadAppCatalog();
  return catalogo.episodes.find((item) => item.id === id) ?? catalogo.pendientes.find((item) => item.id === id);
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string; id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const episodio = loadAppCatalog().pendientes.find((item) => item.id === id);
  return { title: episodio?.etiqueta?.es || id };
}

export default async function Page({ params, searchParams }: { params: Promise<{ lang: string; id: string }>; searchParams: Promise<{ t?: string }> }) {
  const { lang, id } = await params;
  const { t } = await searchParams;
  const ui = lang === "en" ? "en" : "es";
  const copy = copiaSitio(lang);
  const episodio = buscar(id);
  const obra = obraDeEpisodio(id);
  const segundo = Number(t || "0");
  const etiqueta = loadAppCatalog().pendientes.find((item) => item.id === id)?.etiqueta?.[ui];
  const titulo = etiqueta || episodio?.tituloCorto?.[ui] || episodio?.titulo?.[ui] || obra?.titulo[ui] || id;
  return (
    <ProbarAudio>
      <main className="bg-[#0C0B09] pb-28 text-[#F4ECE2]">
        <Lienzo src={obra ? obraWebp(obra) : ""} obraId={obra?.id} alt={obra?.titulo[ui] ?? ""} priority className="h-[62svh] md:h-[70svh]" />
        <div className="mx-auto w-full max-w-3xl px-5 pt-6 md:px-8">
          <h1 className="font-display t-h1">{titulo}</h1>
          <div className="mt-6 flex flex-wrap gap-3">
            <BotonProbar ficha={{ id, titulo }} etiqueta={copy?.playLabel ?? "Escuchar"} className={botonOroVariantes({ variante: "oro" })} />
            <BotonOro asChild variante="fantasma"><a href={`audite://escuchar/${id}?t=${Math.max(0, Math.floor(segundo) || 0)}`}>{copy?.openApp ?? "Abrir en la app"}</a></BotonOro>
            {idsSala().includes(id) ? (
              <Link href={rutaSala(ui, id)} className="inline-flex min-h-11 items-center text-[#E0C48A] underline decoration-[#E0C48A]/40 underline-offset-4">{copy?.salaVerObra}</Link>
            ) : null}
          </div>
          {obra ? <div className="mt-8 max-w-sm"><Placa obra={obra} lang={ui} /></div> : null}
        </div>
      </main>
    </ProbarAudio>
  );
}
