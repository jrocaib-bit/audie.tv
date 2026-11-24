import { leerLibro, loadAppCatalog } from "@audite/content/app-catalog";
import { esPortadaProvisional, obraDeEpisodio, obraWebp } from "@audite/content/obras";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BucleCuadro } from "@/components/bucle-cuadro";
import { PortadaMarca } from "@/components/portada-marca";
import { ObraFoto, Placa } from "@/components/placa";
import { bucleDeEpisodio, estiloDeHueco } from "@/lib/bucles";
import { BotonEscucha } from "@/components/movimiento";
import { resumenPublico } from "@/lib/resumenes";
import { copiaSitio, esIdiomaPublico, idiomasPublicos } from "@/sitio/i18n";
import { origenSitio } from "@/lib/sitio-publico";
import { rutaSala } from "@/lib/sala-cuenta";
import { idsSala } from "@/lib/sala-recorridos";

export const dynamicParams = true;

export async function generateMetadata({ params }: { params: Promise<{ lang: string; id: string }> }): Promise<Metadata> {
  const { lang, id } = await params;
  const copy = copiaSitio(lang);
  const episodio = episodioDe(id);
  const uiLang = lang === "en" ? "en" : "es";
  const titulo = episodio ? tituloDe(episodio, uiLang) : null;
  const languages = Object.fromEntries(idiomasPublicos.map((idioma) => [idioma, `/${idioma}/catalogo/${id}`]));
  return {
    title: { absolute: `${titulo ?? copy?.comingSoon ?? "Audite"} · Audite` },
    description: copy?.episodeDescription,
    alternates: { canonical: `/${lang}/catalogo/${id}`, languages: { ...languages, "x-default": `/es/catalogo/${id}` } },
    openGraph: {
      title: titulo ?? "Audite",
      images: esPortadaProvisional(id)
        ? [`${origenSitio()}/portada/${id}`]
        : obraDeEpisodio(id)
          ? [obraWebp(obraDeEpisodio(id)!)]
          : undefined,
    },
  };
}

function tituloDe(episodio: { titulo?: { es: string | null; en: string | null } | null; tituloCorto?: { es: string | null; en: string | null } | null; etiqueta?: { es: string | null; en: string | null } | null; title?: string }, lang: "es" | "en"): string | null {
  return episodio.titulo?.[lang]?.trim() || episodio.tituloCorto?.[lang]?.trim() || episodio.etiqueta?.[lang]?.trim() || episodio.title?.trim() || null;
}

function episodioDe(id: string) {
  const catalogo = loadAppCatalog();
  return catalogo.pendientes.find((episodio) => episodio.id === id)
    ?? catalogo.episodes.find((episodio) => episodio.id === id)
    ?? leerLibro(id.split("-")[0] ?? "").find((episodio) => episodio.id === id)
    ?? null;
}

export default async function Page({ params }: { params: Promise<{ lang: string; id: string }> }) {
  const { lang, id } = await params;
  if (!esIdiomaPublico(lang)) notFound();
  const copy = copiaSitio(lang);
  if (!copy) notFound();
  const catalogo = loadAppCatalog();
  const episodio = episodioDe(id);
  if (!episodio || !catalogo.rangos.some((item) => item.id === id)) notFound();
  const ui = lang === "en" ? "en" : "es";
  const titulo = tituloDe(episodio, ui) ?? id;
  const libro = catalogo.books.find((item) => item.id === episodio.bookId);
  const referencia = ("etiqueta" in episodio && episodio.etiqueta?.[ui]) || ("scriptureRangeLabel" in episodio ? episodio.scriptureRangeLabel : "") || ("capitulos" in episodio ? episodio.capitulos : "") || "";
  const listo = catalogo.episodes.some((item) => item.id === id);
  const resumen = resumenPublico(id, titulo, referencia || libro?.name[ui] || "", ui);
  const obra = obraDeEpisodio(id);
  const bucle = bucleDeEpisodio(id);
  const poster = bucle?.poster || (obra ? obraWebp(obra) : "");
  const portadaProvisional = esPortadaProvisional(id);
  return (
    <main className="bg-[#100E0C] text-[#F4ECE2]">
      <div className="bg-[#0C0B09]" style={{ viewTransitionName: `ep-${id}` }}>
        {bucle && poster ? (
          <div className="relative mx-auto w-full" style={estiloDeHueco(bucle.aspect)}>
            <BucleCuadro bucle={{ ...bucle, poster, alt: bucle.alt || obra?.titulo[ui] || "" }} priority />
          </div>
        ) : obra && !portadaProvisional ? (
          <div className="relative mx-auto aspect-[4/3] max-h-[64svh] w-full md:aspect-[16/9]">
            <ObraFoto obra={obra} lang={ui} priority />
          </div>
        ) : (
          <div className="relative mx-auto aspect-[16/9] max-h-[46svh] w-full">
            <PortadaMarca episodioId={id} titulo={titulo} lang={ui} className="absolute inset-0" />
          </div>
        )}
      </div>
      <div className="mx-auto w-full max-w-3xl px-5 py-8 md:px-8">
        <nav aria-label={ui === "en" ? "Breadcrumb" : "Migas"} className="t-rotulo text-[#C9A96E]"><Link href={`/${lang}/libro/${episodio.bookId}`} className="inline-flex min-h-11 items-center">{libro?.name[ui] || libro?.name.es}</Link></nav>
        <h1 className="font-display t-display mt-1">{titulo}</h1>
        {referencia ? <p className="t-meta mt-3">{referencia}</p> : null}
        <p className="mt-6 max-w-xl text-lg text-[#E7D7C3]">{resumen.texto}</p>
        {listo ? (
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <BotonEscucha href={`/escuchar?e=${id}`} id={id} titulo={titulo} etiqueta={ui === "en" ? "Listen" : "Escuchar"} />
            {idsSala().includes(id) ? (
              <Link href={rutaSala(ui, id)} className="inline-flex min-h-11 items-center text-[#E0C48A] underline decoration-[#E0C48A]/40 underline-offset-4">{copy.salaVerObra}</Link>
            ) : null}
          </div>
        ) : (
          <p className="t-rotulo mt-6 text-[#8A8175]">{ui === "en" ? "Coming soon" : "Próximamente"}</p>
        )}
        {obra && !portadaProvisional ? (
          <div className="mt-8">
            <Placa obra={obra} lang={ui} />
            <Link href={`/${lang}/creditos`} className="mt-3 inline-flex min-h-11 items-center text-sm text-[#B7AB9C] underline">{ui === "en" ? "About the artwork" : "Sobre la obra"}</Link>
          </div>
        ) : null}
      </div>
    </main>
  );
}
