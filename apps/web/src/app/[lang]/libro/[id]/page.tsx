import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { leerLibro, loadAppCatalog } from "@audite/content/app-catalog";
import { esPortadaProvisional, obraDeEpisodio, obraWebp } from "@audite/content/obras";
import Link from "next/link";
import { PortadaMarca } from "@/components/portada-marca";
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
  const duraciones = new Map(catalogo.episodes.filter((episodio) => episodio.bookId === id).map((episodio) => [episodio.id, episodio.durationSeconds]));
  const episodios = leerLibro(id).map((episodio) => ({
    id: episodio.id,
    orden: episodio.orden,
    titulo: episodio.tituloCorto?.[ui] || episodio.titulo?.[ui] || episodio.etiqueta?.[ui] || episodio.capitulos || episodio.id,
    referencia: episodio.etiqueta?.[ui] || episodio.capitulos || "",
    duracion: duraciones.get(episodio.id) ?? null,
  })).sort((a, b) => a.orden - b.orden || a.id.localeCompare(b.id));
  const nombre = libro.name[ui] || libro.name.es;
  const portadaId = id === "sal" ? "sal-001" : `${id}-01`;
  const portada = obraDeEpisodio(portadaId);
  const disponibles = episodios.filter((episodio) => episodio.duracion != null).length;
  const cuenta = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;
  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-12 text-[#F4ECE2] md:px-8">
      {portada ? (
        <div className="relative mb-8 h-64 overflow-hidden rounded-3xl" style={{ viewTransitionName: `libro-${id}` }}>
          {esPortadaProvisional(portada.episodio) ? (
            <PortadaMarca episodioId={portada.episodio} lang={ui} className="absolute inset-0" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={obraWebp(portada)} alt="" width={portada.ancho} height={portada.alto} className="parallax-obra h-full w-full object-cover" />
          )}
        </div>
      ) : null}
      <p className="text-sm text-[#C9A96E]"><Link href={`/${lang}/catalogo`}>{ui === "en" ? "Catalogue" : "Catálogo"}</Link></p>
      <h1 className="font-display mt-3 text-5xl leading-none">{nombre}</h1>
      <p className="mt-3 text-sm text-[#B7AB9C]">{ui === "en"
        ? `${cuenta(episodios.length, "episode", "episodes")} · ${cuenta(disponibles, "available", "available")}`
        : `${cuenta(episodios.length, "episodio", "episodios")} · ${cuenta(disponibles, "disponible", "disponibles")}`}</p>
      <ul className="mt-8 divide-y divide-[#2E2924] border-y border-[#2E2924]">
        {episodios.map((episodio) => {
          const obra = obraDeEpisodio(episodio.id);
          const listo = episodio.duracion != null;
          return (
            <li key={episodio.id} className="flex min-h-16 items-center gap-3 py-3">
              <Link href={`/${lang}/catalogo/${episodio.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                <span className="relative size-14 shrink-0 overflow-hidden rounded-md bg-[#241F1A]" style={{ viewTransitionName: `ep-${episodio.id}` }}>
                  {obra && esPortadaProvisional(obra.episodio) ? (
                    <PortadaMarca episodioId={obra.episodio} lang={ui} className="absolute inset-0" />
                  ) : obra ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={obraWebp(obra)} alt="" width={obra.ancho} height={obra.alto} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                  ) : <PortadaMarca episodioId={episodio.id} titulo={episodio.titulo} className="absolute inset-0" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-lg leading-tight">{episodio.titulo}</span>
                  <span className="mt-0.5 block text-sm text-[#B7AB9C]">{episodio.referencia}{listo ? ` · ${reloj(episodio.duracion ?? 0)}` : ""}</span>
                </span>
              </Link>
              <span className="flex shrink-0 items-center gap-2 text-sm">
                <span className="estado-punto" data-listo={listo ? "1" : "0"} aria-hidden="true" />
                {listo ? (
                  <Link href={`/escuchar?e=${episodio.id}`} className="text-[#C9A96E]">{ui === "en" ? "Listen" : "Escuchar"}</Link>
                ) : (
                  <span className="text-[#8A8175]">{ui === "en" ? "Coming soon" : "Próximamente"}</span>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </main>
  );
}

function reloj(segundos: number): string {
  const total = Math.max(0, Math.round(segundos));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}
