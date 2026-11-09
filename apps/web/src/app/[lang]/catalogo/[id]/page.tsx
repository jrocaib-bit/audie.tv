import { leerLibro, loadAppCatalog } from "@audite/content/app-catalog";
import { creditoVisible, type PendingEpisode } from "@audite/domain";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SitioHeader } from "@/components/sitio";
import { copiaSitio, idiomasPublicos } from "@/sitio/i18n";

export const dynamicParams = true;

export async function generateMetadata({ params }: { params: Promise<{ lang: string; id: string }> }): Promise<Metadata> {
  const { lang, id } = await params;
  const copy = copiaSitio(lang);
  const episodio = episodioDe(id);
  const uiLang = lang === "en" ? "en" : "es";
  const titulo = episodio ? tituloDePagina(episodio, uiLang) : null;
  const languages = Object.fromEntries(idiomasPublicos.map((idioma) => [idioma, `/${idioma}/catalogo/${id}`]));
  return {
    title: { absolute: `${titulo ?? copy?.comingSoon ?? "audˈte"} · audˈte` },
    description: copy?.episodeDescription,
    alternates: { canonical: `/${lang}/catalogo/${id}`, languages: { ...languages, "x-default": `/es/catalogo/${id}` } },
  };
}

function tituloDePagina(episodio: PendingEpisode, lang: "es" | "en"): string | null {
  return episodio.titulo?.[lang]?.trim() || episodio.tituloCorto?.[lang]?.trim() || episodio.etiqueta?.[lang]?.trim() || null;
}

function episodioDe(id: string) {
  const catalogo = loadAppCatalog();
  return catalogo.pendientes.find((episodio) => episodio.id === id) ?? leerLibro(id.split("-")[0] ?? "").find((episodio) => episodio.id === id) ?? null;
}

export default async function Page({ params }: { params: Promise<{ lang: string; id: string }> }) {
  const { lang, id } = await params;
  const copy = copiaSitio(lang);
  if (!copy) notFound();
  const catalogo = loadAppCatalog();
  const episodio = episodioDe(id);
  if (!episodio || !catalogo.rangos.some((item) => item.id === id)) notFound();
  const uiLang = lang === "en" ? "en" : "es";
  const titulo = tituloDePagina(episodio, uiLang);
  const libro = catalogo.books.find((item) => item.id === episodio.bookId);
  const fuente = catalogo.fuenteTexto[uiLang];
  return (
    <>
      <SitioHeader lang={lang} copy={copy} />
      <main className="mx-auto w-full max-w-3xl px-5 py-14">
        <p className="kicker">{libro?.name[uiLang] || libro?.name.es}</p>
        <h1 className="mt-3 font-serif text-5xl leading-tight">{titulo ?? copy.comingSoon}</h1>
        {titulo ? null : <p className="mt-4 text-muted">{copy.comingSoonBody}</p>}
        <p className="mt-6 text-sm text-muted">
          {episodio.capitulos ?? episodio.rango ?? ""}
          {episodio.capitulos || episodio.rango ? " · " : ""}
          {episodio.propuesta ? `${copy.proposed} · ` : ""}
          {episodio.presentacion === "revision" ? copy.review : copy.pending}
        </p>
        <p className="mt-8 text-muted">
          {creditoVisible(fuente, copy.aboutTitle, copy.sourcePending)}
        </p>
        <Link href={`/${lang}/catalogo`} className="mt-10 inline-flex min-h-11 items-center underline decoration-border underline-offset-4">
          {copy.catalogTitle}
        </Link>
      </main>
    </>
  );
}
