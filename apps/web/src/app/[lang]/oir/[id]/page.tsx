import type { Metadata } from "next";
import { loadAppCatalog } from "@audite/content/app-catalog";
import { obraDeEpisodio, obraWebp } from "@audite/content/obras";

export async function generateMetadata({ params }: { params: Promise<{ lang: string; id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const episodio = loadAppCatalog().pendientes.find((item) => item.id === id);
  return { title: episodio?.etiqueta?.es || id };
}

export default async function Page({ params, searchParams }: { params: Promise<{ lang: string; id: string }>; searchParams: Promise<{ t?: string }> }) {
  const { lang, id } = await params;
  const { t } = await searchParams;
  const ui = lang === "en" ? "en" : "es";
  const episodio = loadAppCatalog().pendientes.find((item) => item.id === id);
  const obra = obraDeEpisodio(id);
  const segundo = Number(t || "0");
  return (
    <main className="flex min-h-full flex-col items-center bg-[#100E0C] px-5 py-8 text-[#F4ECE2]">
      <article className="relative aspect-[9/16] w-full max-w-sm overflow-hidden rounded-3xl">
        {obra ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={obraWebp(obra)} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-[#100E0C] to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-5">
          <h1 className="font-display text-4xl leading-none">{episodio?.etiqueta?.[ui] || id}</h1>
        </div>
      </article>
      <a href={`audite://escuchar/${id}?t=${Math.max(0, Math.floor(segundo))}`} className="mt-5 inline-flex min-h-12 items-center rounded-full bg-[#C9A96E] px-5 text-[#100E0C]">{ui === "en" ? "Open" : "Abrir"}</a>
    </main>
  );
}