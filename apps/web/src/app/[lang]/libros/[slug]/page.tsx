import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { altCubierta, rotuloCapitulo, textoLimpio } from "@audite/domain";
import { BotonesLibro, ProveedorAcceso } from "@/components/libros/acceso-libro";
import { Cubierta } from "@/components/libros/cubierta";
import { PortadaLanding } from "@/components/libros/portada-landing";
import { mockDeParametro } from "@/lib/libros/acceso";
import { ID_LIBRO, cargarFicha } from "@/lib/libros/carga";
import { cargarEstanteria } from "@/lib/libros/estanteria";
import {
  TEXTOS_LANDING,
  etiquetaReferencia,
  idiomaUi,
  jsonLdLibro,
  marcaIndice,
  metadatosLanding,
  repartirReferencias,
  serializarJsonLd,
  type DatosLanding,
} from "@/lib/libros/landing";
import { origenSitio } from "@/lib/sitio-publico";
import { esIdiomaPublico } from "@/sitio/i18n";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ lang: string; slug: string }>; searchParams?: Promise<Record<string, string | string[] | undefined>> };

async function datos(slug: string) {
  if (!ID_LIBRO.test(slug)) return null;
  const ficha = await cargarFicha(slug);
  if (!ficha) return null;
  const volumen = (await cargarEstanteria())?.find((v) => v.id === slug) ?? null;
  return { ficha, volumen };
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { lang, slug } = await params;
  const d = esIdiomaPublico(lang) ? await datos(slug) : null;
  if (!d) return { title: "Libros", robots: { index: false } };
  return metadatosLanding(d satisfies DatosLanding, lang, origenSitio());
}

const FOCO = "outline-offset-4 focus-visible:outline-2 focus-visible:outline-[#C9A96E]";

function Referencias({ lang, lista }: { lang: string; lista: { episodio_id: string; etiqueta: string; titulo: string }[] }) {
  const { visibles, resto } = repartirReferencias(lista);
  const item = (e: { episodio_id: string; etiqueta: string; titulo: string }) => (
    <li key={e.episodio_id} className="list-none border-b border-[#2E2924]">
      <Link href={`/${lang}/catalogo/${e.episodio_id}`} className={`grid min-h-11 gap-0.5 py-3 ${FOCO}`}>
        <span className="text-sm text-[#C9A96E]">{etiquetaReferencia(e)}</span>
        <span lang="es">{textoLimpio(e.titulo)}</span>
      </Link>
    </li>
  );
  return (
    <>
      <ul className="mt-4 grid gap-x-8 sm:grid-cols-2">{visibles.map(item)}</ul>
      {resto.length > 0 ? (
        <details className="mt-2" data-resto-referencias="">
          <summary className={`inline-flex min-h-11 cursor-pointer items-center text-[#C9A96E] underline underline-offset-4 ${FOCO}`}>{TEXTOS_RESTO[lang === "en" ? "en" : "es"](resto.length)}</summary>
          <ul className="grid gap-x-8 sm:grid-cols-2">{resto.map(item)}</ul>
        </details>
      ) : null}
    </>
  );
}

const TEXTOS_RESTO = { es: TEXTOS_LANDING.es.verTodas, en: TEXTOS_LANDING.en.verTodas };

export default async function Page({ params, searchParams }: Params) {
  const { lang, slug } = await params;
  if (!esIdiomaPublico(lang) || !ID_LIBRO.test(slug)) notFound();
  const d = await datos(slug);
  if (!d) notFound();
  const { ficha, volumen } = d;
  const ui = idiomaUi(lang);
  const t = TEXTOS_LANDING[ui];
  const mock = mockDeParametro((await searchParams)?.mock);
  const borrador = ficha.disponibilidad === "borrador";
  const lectura = ficha.disponibilidad === "lectura";
  const titulo = textoLimpio(ficha.titulo);
  const rotulo = volumen?.rotulo || `${t.volumen(ficha.volumen)} · ${textoLimpio(ficha.libro_biblico)}`;
  const origen = origenSitio();
  const jsonLd = serializarJsonLd(jsonLdLibro(d, lang, origen, ficha.indice));
  const referencias = ficha.episodios_del_libro_comentado;
  const cruzados = ficha.episodios_cruzados;
  const sinopsis = volumen?.sinopsis ?? "";
  // En /en la interfaz va en inglés y el contenido del libro, que es español, lleva lang="es".
  const marcaEs = ui === "en" ? ({ lang: "es" } as const) : {};
  return (
    <ProveedorAcceso id={ficha.id} mock={mock} activo={lectura}>
      <main data-libro-ficha={ficha.id} data-landing="" data-estado={ficha.disponibilidad} className="mx-auto w-full max-w-5xl px-5 py-5 text-[#F4ECE2] md:px-8 md:py-12">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
        <nav aria-label={t.migas}>
          <ol className="flex flex-wrap items-center gap-x-2 text-sm text-[#B7AB9C]">
            <li><Link href={`/${lang}/libros`} className={`inline-flex min-h-11 items-center text-[#C9A96E] ${FOCO}`}>{t.libros}</Link></li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" {...marcaEs}>{titulo}</li>
          </ol>
        </nav>
        <header data-landing-cabecera="" className="mt-2 grid gap-x-14 gap-y-5 md:grid-cols-[minmax(0,320px)_1fr] md:items-start">
          <div className="grid gap-2 md:col-start-2 md:row-start-1">
            <p className="text-xs tracking-[0.16em] text-[#C9A96E] uppercase" {...marcaEs}>{rotulo}</p>
            <h1 className="font-display text-[2rem] leading-[1.02] md:text-6xl md:leading-[0.98]" {...marcaEs}>{titulo}</h1>
            {ficha.subtitulo ? <p className="text-base text-[#E7D7C3] md:text-xl" {...marcaEs}>{textoLimpio(ficha.subtitulo)}</p> : null}
            {borrador ? <p><span data-insignia="en-preparacion" className="inline-flex min-h-8 items-center rounded-full border border-[#C9A96E]/60 px-3 text-sm text-[#C9A96E]">{t.enPreparacion}</span></p> : null}
          </div>
          <div className="w-28 md:col-start-1 md:row-span-2 md:row-start-1 md:w-full" data-cubierta-landing="">
            {volumen ? (
              <PortadaLanding volumen={volumen.volumen} alt={ui === "en" ? `Cover of «${titulo}», volume ${volumen.volumen}, Audite collection.` : altCubierta({ volumen: volumen.volumen, titulo })} />
            ) : (
              <Cubierta volumen={ficha.volumen} titulo={titulo} libroBiblico={ficha.libro_biblico} compactaMovil />
            )}
          </div>
          <div className="grid content-start gap-5 md:col-start-2 md:row-start-2">
            {sinopsis ? <p className="text-[15px] leading-snug text-[#E7D7C3] md:text-lg md:leading-relaxed" {...marcaEs}>{sinopsis}</p> : null}
            {borrador || !lectura ? (
              <p data-aviso={borrador ? "en-preparacion" : "preparandose"} className="max-w-md rounded-2xl border border-[#2E2924] bg-[#1B1815] px-4 py-3 text-[#E7D7C3]">{borrador ? t.avisoBorrador : t.preparandose}</p>
            ) : (
              <BotonesLibro lang={lang} id={ficha.id} disponibilidad={ficha.disponibilidad} ui={ui} mock={mock} ubicacion="resumen" />
            )}
            {ui === "en" ? <p className="text-sm text-[#B7AB9C]">{t.contenidoEs}</p> : null}
            {!borrador ? (
              <button type="button" disabled aria-disabled="true" data-accion="audiolibro" className="inline-flex min-h-12 max-w-md cursor-not-allowed items-center justify-between gap-4 rounded-full border border-[#2E2924] px-6 text-[#8A8175]">
                <span>{t.audiolibro}</span>
                <span className="text-sm">{t.audiolibroAviso}</span>
              </button>
            ) : null}
            {ficha.amazon_paperback_url || ficha.amazon_kindle_url ? (
              <div className="flex flex-wrap gap-3" data-amazon="">
                {ficha.amazon_paperback_url ? <a href={ficha.amazon_paperback_url} rel="noopener noreferrer" target="_blank" className={`inline-flex min-h-11 items-center rounded-full border border-[#C9A96E]/60 px-5 text-[#C9A96E] ${FOCO}`}>{ui === "en" ? "Buy in paperback" : "Comprar en papel"}</a> : null}
                {/* Kindle solo en la web. En la app no hay botón ni enlace (Apple 3.1.3 y política de pagos de Play). */}
                {ficha.amazon_kindle_url ? <a href={ficha.amazon_kindle_url} rel="noopener noreferrer" target="_blank" className={`inline-flex min-h-11 items-center rounded-full border border-[#C9A96E]/60 px-5 text-[#C9A96E] ${FOCO}`}>{ui === "en" ? "Buy on Kindle" : "Comprar en Kindle"}</a> : null}
              </div>
            ) : null}
          </div>
        </header>

        {lectura ? (
          <section data-suscripcion="" aria-labelledby="suscripcion" className="mt-12 rounded-3xl border border-[#C9A96E]/40 bg-[#1B1815] px-6 py-8 md:px-10">
            <h2 id="suscripcion" className="font-display text-3xl leading-tight">{t.suscripcionTitulo}</h2>
            <p className="mt-3 max-w-xl text-[#E7D7C3]">{t.suscripcionTexto}</p>
            <div className="mt-6"><BotonesLibro lang={lang} id={ficha.id} disponibilidad={ficha.disponibilidad} ui={ui} mock={mock} ubicacion="tarjeta" /></div>
          </section>
        ) : null}

        <section id="indice" className="mt-14 scroll-mt-24" aria-labelledby="indice-titulo">
          <h2 id="indice-titulo" className="font-display text-3xl">{t.indice}</h2>
          {borrador ? (
            <p data-indice-pendiente="" className="mt-4 text-[#B7AB9C]">{t.indiceBorrador}</p>
          ) : (
            <ol className="mt-5 divide-y divide-[#2E2924] border-y border-[#2E2924]">
              {ficha.indice.map((entrada) => {
                const marca = marcaIndice(entrada, ui);
                const cuerpo = (
                  <span className="grid gap-0.5 py-1" {...marcaEs}>
                    <span className="text-xs tracking-[0.14em] text-[#B7AB9C] uppercase">{rotuloCapitulo(entrada)}</span>
                    <span className="text-lg">{textoLimpio(entrada.titulo)}</span>
                  </span>
                );
                return (
                  <li key={entrada.id} data-entrada={entrada.id} className="flex min-h-11 items-center justify-between gap-4 py-2">
                    {lectura ? <Link href={`/${lang}/libros/${ficha.slug}/leer?c=${entrada.id}`} className={`block ${FOCO}`}>{cuerpo}</Link> : cuerpo}
                    {lectura ? <span data-marca={marca.adelanto ? "adelanto" : "suscripcion"} className={`shrink-0 text-sm ${marca.adelanto ? "text-[#C9A96E]" : "text-[#B7AB9C]"}`}>{marca.texto}</span> : null}
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        {referencias.length > 0 || cruzados.length > 0 ? (
          <section id="referencias" className="mt-14 scroll-mt-24" aria-labelledby="referencias-titulo">
            <h2 id="referencias-titulo" className="font-display text-3xl">{t.referencias}</h2>
            <p className="mt-2 text-[#B7AB9C]">{t.referenciasIntro}</p>
            {referencias.length > 0 ? <Referencias lang={lang} lista={referencias} /> : null}
            {cruzados.length > 0 ? (
              <>
                <h3 className="mt-8 text-sm tracking-[0.16em] text-[#C9A96E] uppercase">{t.cruzados}</h3>
                <Referencias lang={lang} lista={cruzados} />
              </>
            ) : null}
          </section>
        ) : null}

        {lectura ? (
          <section data-cierre="" aria-labelledby="cierre" className="mt-14 border-t border-[#2E2924] pt-10">
            <h2 id="cierre" className="font-display text-2xl">{t.cierreTitulo}</h2>
            <p className="mt-2 max-w-xl text-[#E7D7C3]">{t.cierreTexto}</p>
            <div className="mt-5"><BotonesLibro lang={lang} id={ficha.id} disponibilidad={ficha.disponibilidad} ui={ui} mock={mock} ubicacion="cierre" /></div>
          </section>
        ) : null}

        {volumen?.credito_obra ? <p data-credito="" className="mt-12 text-xs text-[#B7AB9C]" {...marcaEs}>{t.portada}{volumen.credito_obra}</p> : null}
      </main>
    </ProveedorAcceso>
  );
}
