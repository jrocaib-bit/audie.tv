import { leerLibro, loadAppCatalog } from "@audite/content/app-catalog";
import { obraDeEpisodio } from "@audite/content/obras";
import { creditoVisible, type PendingEpisode } from "@audite/domain";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ObraFoto, Placa } from "@/components/placa";
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
    title: { absolute: `${titulo ?? copy?.comingSoon ?? "Audite"} · Audite` },
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
  const obra = obraDeEpisodio(episodio.id);
  const estado = episodio.propuesta ? copy.proposed : episodio.presentacion === "revision" ? copy.review : copy.pending;
  return (
    <>
      <SitioHeader lang={lang} copy={copy} sobreObra={Boolean(obra)} />
      <main>
        {obra ? (
          <section className="relative min-h-[78svh] bg-[#0C0B09] text-[#F4ECE2]">
            <div className="absolute inset-0 overflow-hidden">
              <ObraFoto obra={obra} priority className="h-full w-full object-cover" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#100E0C] via-[#100E0C]/60 to-[#100E0C]/30" />
            <div className="relative z-10 mx-auto flex min-h-[78svh] w-full max-w-6xl flex-col justify-end px-5 pb-8 pt-28 md:px-8">
              <p className="kicker text-[#C9A96E]">{libro?.name[uiLang] || libro?.name.es}</p>
              <h1 className="font-display mt-3 max-w-4xl text-5xl leading-[0.95] md:text-7xl">{titulo ?? copy.comingSoon}</h1>
              <p className="mt-4 text-sm text-[#B7AB9C]">
                {episodio.capitulos ?? episodio.rango ?? ""}
                {episodio.capitulos || episodio.rango ? " · " : ""}
                {estado}
              </p>
              <div className="mt-8 max-w-xl">
                <Placa obra={obra} lang={uiLang} />
              </div>
            </div>
          </section>
        ) : (
          <section className="mx-auto w-full max-w-3xl px-5 py-16">
            <p className="kicker">{libro?.name[uiLang] || libro?.name.es}</p>
            <h1 className="font-display mt-3 text-5xl leading-tight">{titulo ?? copy.comingSoon}</h1>
            <p className="mt-6 text-sm text-muted">
              {episodio.capitulos ?? episodio.rango ?? ""}
              {episodio.capitulos || episodio.rango ? " · " : ""}
              {estado}
            </p>
          </section>
        )}
        <section className="mx-auto w-full max-w-3xl px-5 py-12">
          <p className="text-muted">{creditoVisible(fuente, copy.aboutTitle, copy.sourcePending)}</p>
          <Link href={`/${lang}/catalogo`} className="mt-8 inline-flex min-h-11 items-center underline decoration-border underline-offset-4">
            {copy.catalogTitle}
          </Link>
        </section>
      </main>
    </>
  );
}
