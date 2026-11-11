import { leerLibro, loadAppCatalog } from "@audite/content/app-catalog";
import { obraDeEpisodio } from "@audite/content/obras";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ObraFoto } from "@/components/placa";
import { BotonEscucha } from "@/components/movimiento";
import { resumenPublico } from "@/lib/resumenes";
import { copiaSitio, esIdiomaPublico, idiomasPublicos } from "@/sitio/i18n";

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
  return (
    <main className="bg-[#100E0C] text-[#F4ECE2]">
      <div className="relative min-h-[46svh] overflow-hidden bg-[#1B1815]" style={{ viewTransitionName: `ep-${id}` }}>
        {obra ? <ObraFoto obra={obra} priority className="ken-burns absolute inset-0 h-full w-full object-cover" /> : null}
        <div className="absolute inset-0 bg-gradient-to-t from-[#100E0C] via-[#100E0C]/35 to-transparent" />
        <div className="relative z-10 mx-auto flex min-h-[46svh] w-full max-w-3xl flex-col justify-end px-5 pb-8 md:px-8">
          <p className="text-sm text-[#C9A96E]"><Link href={`/${lang}/libro/${episodio.bookId}`}>{libro?.name[ui] || libro?.name.es}</Link></p>
          <h1 className="font-display mt-2 max-w-3xl text-4xl leading-tight md:text-6xl">{titulo}</h1>
          <p className="mt-2 text-[#E7D7C3]">{referencia}</p>
        </div>
      </div>
      <div className="mx-auto w-full max-w-3xl px-5 py-8 md:px-8">
        <p className="max-w-xl text-lg">{resumen.texto}</p>
        {listo ? (
          <div className="mt-6"><BotonEscucha href={`/escuchar?e=${id}`} id={id} titulo={titulo} etiqueta={ui === "en" ? "Listen" : "Escuchar"} /></div>
        ) : (
          <p className="mt-6 text-sm text-[#8A8175]">{ui === "en" ? "Coming soon" : "Próximamente"}</p>
        )}
        {obra ? (
          <p className="mt-8 text-sm text-[#B7AB9C]">
            {obra.titulo[ui]} · {obra.autor[ui]}
            {" · "}
            <Link href={`/${lang}/creditos`} className="underline">{ui === "en" ? "About the artwork" : "Sobre la obra"}</Link>
          </p>
        ) : null}
      </div>
    </main>
  );
}
