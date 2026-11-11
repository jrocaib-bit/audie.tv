import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { leerLibro, loadAppCatalog } from "@audite/content/app-catalog";
import { obraDeEpisodio, obraWebp } from "@audite/content/obras";
import Link from "next/link";
import { esIdiomaPublico } from "@/sitio/i18n";

export async function generateMetadata({ params }: { params: Promise<{ lang: string; id: string }> }): Promise<Metadata> {
  const { lang, id } = await params;
  const libro = loadAppCatalog().books.find((item) => item.id === id);
  const ui = lang === "en" ? "en" : "es";
  const nombre = libro?.name[ui] || libro?.name.es || id;
  return { title: nombre, description: nombre };
}

export default async function Page({ params }: { params: Promise<{ lang: string; id: string }> }) {
  const { lang, id } = await params;
  if (!esIdiomaPublico(lang)) notFound();
  const ui = lang === "en" ? "en" : "es";
  const catalogo = loadAppCatalog();
  const libro = catalogo.books.find((item) => item.id === id);
  if (!libro) notFound();
  const listos = new Set(catalogo.episodes.filter((episodio) => episodio.bookId === id).map((episodio) => episodio.id));
  const episodios = leerLibro(id).map((episodio) => ({
    id: episodio.id,
    orden: episodio.orden,
    titulo: episodio.titulo?.[ui] || episodio.etiqueta?.[ui] || episodio.capitulos || episodio.id,
    referencia: episodio.etiqueta?.[ui] || episodio.capitulos || "",
    listo: listos.has(episodio.id),
  })).sort((a, b) => a.orden - b.orden || a.id.localeCompare(b.id));
  const nombre = libro.name[ui] || libro.name.es;
  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-12 text-[#F4ECE2] md:px-8">
      <p className="text-sm text-[#C9A96E]"><Link href={`/${lang}/catalogo`}>{ui === "en" ? "Catalogue" : "Catálogo"}</Link></p>
      <h1 className="font-display mt-3 text-5xl leading-none">{nombre}</h1>
      <p className="mt-3 text-[#B7AB9C]">{episodios.length} {ui === "en" ? "episodes" : "episodios"}</p>
      <ul className="mt-8 divide-y divide-[#2E2924] border-y border-[#2E2924]">
        {episodios.map((episodio) => {
          const obra = obraDeEpisodio(episodio.id);
          return (
            <li key={episodio.id}>
              <Link href={`/${lang}/catalogo/${episodio.id}`} className="flex min-h-16 items-center gap-3 py-3">
                <span className="size-14 shrink-0 overflow-hidden rounded-md bg-[#1B1815]">
                  {obra ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={obraWebp(obra)} alt="" className="h-full w-full object-cover" />
                  ) : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-lg leading-tight">{episodio.titulo}</span>
                  <span className="mt-0.5 block text-sm text-[#B7AB9C]">{episodio.referencia}</span>
                </span>
                <span className="shrink-0 text-sm text-[#C9A96E]">{episodio.listo ? (ui === "en" ? "Available" : "Disponible") : (ui === "en" ? "Upcoming" : "Próximamente")}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
