import type { Metadata } from "next";
import { leerLibro, loadAppCatalog } from "@audite/content/app-catalog";
import { obraDeEpisodio, obraWebp, obrasVisibles } from "@audite/content/obras";
import Link from "next/link";

export async function generateMetadata({ params }: { params: Promise<{ lang: string; id: string }> }): Promise<Metadata> {
  const { lang, id } = await params;
  const libro = loadAppCatalog().books.find((item) => item.id === id);
  const ui = lang === "en" ? "en" : "es";
  const nombre = libro?.name[ui] || libro?.name.es || id;
  return { title: nombre, description: nombre };
}

export default async function Page({ params }: { params: Promise<{ lang: string; id: string }> }) {
  const { lang, id } = await params;
  const ui = lang === "en" ? "en" : "es";
  const catalogo = loadAppCatalog();
  const libro = catalogo.books.find((item) => item.id === id);
  const lista = obrasVisibles();
  const obra = obraDeEpisodio(`${id}-01`) ?? lista[id.split("").reduce((suma, signo) => suma + signo.charCodeAt(0), 0) % Math.max(1, lista.length)] ?? null;
  const fuente = leerLibro(id);
  const filas = (fuente.length > 0 ? fuente : catalogo.pendientes.filter((episodio) => episodio.bookId === id)).slice(0, 8);
  const nombre = libro?.name[ui] || libro?.name.es || id;
  return (
    <main className="min-h-full bg-[#100E0C] text-[#F4ECE2]">
      <div className="relative h-72 overflow-hidden bg-[#1B1815]">
        {obra ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={obraWebp(obra)} alt="" className="h-full w-full object-cover" />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-[#100E0C] to-transparent" />
        <h1 className="font-display absolute right-5 bottom-5 left-5 text-[clamp(2.1rem,10vw,3.25rem)] leading-none whitespace-nowrap">{nombre}</h1>
      </div>
      <div className="mx-auto flex w-full max-w-lg flex-col gap-3 px-5 py-6">
        <a href={`audite://libro/${id}`} className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#C9A96E] text-[#100E0C]">{ui === "en" ? "Open in the app" : "Abrir en la app"}</a>
        <ul>
          {filas.map((episodio) => (
            <li key={episodio.id} className="flex min-h-12 items-center border-b border-white/10 font-display text-xl">{episodio.etiqueta?.[ui] || episodio.capitulos}</li>
          ))}
        </ul>
        <Link href={`/${ui}/creditos`} className="text-sm text-[#B7AB9C]">{ui === "en" ? "Credits" : "Créditos"}</Link>
      </div>
    </main>
  );
}
