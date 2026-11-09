import type { Metadata } from "next";
import { leerLibro } from "@audite/content/app-catalog";
import { obraWebp, obrasVisibles } from "@audite/content/obras";
import { TEMAS } from "@audite/domain";
import Link from "next/link";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }: { params: Promise<{ lang: string; id: string }> }): Promise<Metadata> {
  const { id, lang } = await params;
  const tema = TEMAS.find((item) => item.id === id);
  const ui = lang === "en" ? "en" : "es";
  return { title: tema?.titulo[ui] ?? "Audite", description: tema?.titulo[ui] };
}

export default async function Page({ params }: { params: Promise<{ lang: string; id: string }> }) {
  const { lang, id } = await params;
  const tema = TEMAS.find((item) => item.id === id);
  if (!tema) notFound();
  const ui = lang === "en" ? "en" : "es";
  const lista = obrasVisibles();
  const obra = lista.find((item) => item.episodio.startsWith(`${tema.libroId}-`)) ?? lista[0];
  const filas = leerLibro(tema.libroId).slice(0, 6);
  return (
    <main className="min-h-full bg-[#100E0C] text-[#F4ECE2]">
      <div className="relative h-72 overflow-hidden" style={{ background: tema.color }}>
        {obra ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={obraWebp(obra)} alt="" className="h-full w-full object-cover" />
        ) : null}
        <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, transparent 20%, ${tema.color} 100%)` }} />
        <h1 className="font-display absolute right-5 bottom-5 left-5 text-[clamp(2.1rem,10vw,3.25rem)] leading-none whitespace-nowrap">{tema.titulo[ui]}</h1>
      </div>
      <div className="mx-auto flex w-full max-w-lg flex-col gap-3 px-5 py-6">
        <a href={`audite://libro/${tema.libroId}`} className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#C9A96E] text-[#100E0C]">{ui === "en" ? "Open in the app" : "Abrir en la app"}</a>
        <ul>
          {filas.map((episodio) => (
            <li key={episodio.id} className="flex min-h-12 items-center border-b border-white/10 font-display text-xl whitespace-nowrap">{episodio.etiqueta?.[ui] || episodio.capitulos}</li>
          ))}
        </ul>
        <Link href={`/${ui}/libro/${tema.libroId}`} className="text-sm text-[#B7AB9C]">{ui === "en" ? "Book" : "Libro"}</Link>
      </div>
    </main>
  );
}
